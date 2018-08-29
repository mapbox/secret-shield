'use strict';

const cf = require('@mapbox/cloudfriend');
const watchbot = require('@mapbox/watchbot');

// Generate Watchbot resources. You can use references to parameters and
// resources that were defined above.
let watch = watchbot.template({
  cluster: 'processing',
  service: 'secret-shield',
  messageTimeout: 7200,
  env: {
    NPMAccessToken: cf.ref('NPMAccessToken'),
    AWS_DEFAULT_REGION: cf.region,
    SSHKey: cf.ref('SSHKey'),
    REPO_BUCKET_SOURCE: cf.ref('RepoListJSONBucket'),
    REPO_KEY_SOURCE: cf.ref('RepoListJSONKey'),
    GITHUB_ORG: cf.ref('GitHubOrg')
  },
  serviceVersion: {
    Ref: 'GitSha'
  },
  command: '/bin/sh ./bin/watchbot-worker.sh',
  writableFilesystem: true,
  maxSize: 2,
  minSize: 0,
  messageRetention: 518400, // 6 days
  deadletterThreshold: 3, // try only three times
  reservation: {
    memory: cf.ref('WorkerMem'),
    cpu: cf.ref('WorkerCPU')
  },
  notificationEmail: {
    Ref: 'AlarmEmail'
  }
});

// Build the parameters, resources, and outputs that your service needs
let secretShieldTemplate = {
  Parameters: {
    GitSha: {
      Type: 'String'
    },
    CodeS3Bucket: {
      Type: 'String',
      Default: ''
    },
    AlarmEmail: {
      Type: 'String',
      Default: 'devnull@mapbox.com'
    },
    WorkerMem: {
      Description: 'Memory per worker in MB',
      Type: 'Number',
      Default: 1024
    },
    WorkerCPU: {
      Description: 'CPU per worker (1024 = one cpu)',
      Type: 'Number',
      Default: 1024
    },
    NPMAccessToken: {
      Type: 'String',
      Description: '[secure] npm access token used to install private packages'
    },
    SSHKey: {
      Type: 'String',
      Description: '[secure] ssh key to clone repositories, base64 encoded'
    },
    ScheduleExpression: {
      Description: 'How often should we run this assessment. Use a valid ScheduleExpression',
      Type: 'String',
      Default: 'rate(12 hours)'
    },
    GitHubOrg: {
      Description: 'GitHub org that contains the repositories',
      Type: 'String'
    },
    ExcludeReposList: {
      Description: 'List of repos to exclude. The repos should be comma separated',
      Type: 'String'
    },
    RepoListJSONBucket: {
      Description: 'Name of s3 bucket that contains the repository list JSON',
      Type: 'String'
    },
    RepoListJSONKey: {
      Description: 'File inside the s3 bucket that contains the repo list JSON in the form [{"name":"my-repo","archived":false,"fork":false},...]',
      Type: 'String'
    }
  },
  Resources: {
    LambdaExecutionRole: {
      Type: 'AWS::IAM::Role',
      Properties: {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Sid: '',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            },
            {
              Sid: '',
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            },
            {
              Sid: '',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            },
            {
              Sid: '',
              Effect: 'Allow',
              Principal: {
                Service: 'sqs.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            },
          ]
        },
        Policies: [
          {
            PolicyName: 'logs',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents'
                  ],
                  Resource: '*'
                }
              ]
            }
          },
          // TODO: Limit the action to only to secret-shield watchbot queue
          {
            PolicyName: 'send_messages_to_watchbot_sqs',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:SendMessage',
                    's3:GetObject',
                  ],
                  Resource: watch.ref.queueArn
                }
              ]
            }
          },
          {
            PolicyName: 'patrolcache',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                  ],
                  Resource: cf.join('', ['arn:aws:s3:::', cf.ref('RepoListJSONBucket'), cf.ref('RepoListJSONKey')])
                }
              ]
            }
          }
        ]
      }
    },
    ScheduledScheduleRule: {
      Type: 'AWS::Events::Rule',
      Properties: {
        Description: 'Scheduler to run AWS put messages in secret-shield watchbot sqs queue',
        State: 'ENABLED',
        ScheduleExpression: cf.ref('ScheduleExpression'),
        Targets: [
          {
            Arn: cf.getAtt('LambdaFunction', 'Arn'),
            Id: 'TargetFunction'
          }
        ]
      },
    },
    ScheduledSchedulePermission: {
      Type: 'AWS::Lambda::Permission',
      Properties: {
        FunctionName: cf.getAtt('LambdaFunction', 'Arn'),
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
        SourceArn: cf.getAtt('ScheduledScheduleRule', 'Arn')
      }
    },
    LambdaFunction: {
      Type: 'AWS::Lambda::Function',
      Properties: {
        Code: {
          S3Bucket: cf.ref('CodeS3Bucket'),
          S3Key: cf.join('', ['bundles/secret-shield/', cf.ref('GitSha'), '.zip'])
        },
        Handler: 'lambda/index.handler',
        Runtime: 'nodejs8.10',
        Timeout: 240,
        MemorySize: 128,
        Environment: {
          Variables: {
            QueueUrl: watch.ref.queueUrl,
            ExcludeReposList: cf.ref('ExcludeReposList')
          }
        },
        Role: cf.getAtt('LambdaExecutionRole', 'Arn')
      }
    },
  }
};

module.exports = cf.merge(secretShieldTemplate, watch);
