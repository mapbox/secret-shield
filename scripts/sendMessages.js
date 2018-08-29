// Sends messages containing repository names given in the first argument to an sqs queue given in the second argument

// Usage: node sendMessages.js fileWithAllRepos.js queueURL --execute
// fileWithAllRepos contains all the repos separated by newlines

const AWS = require('aws-sdk');
const d3 = require('d3-queue');
const fs = require('fs');

let sqs = new AWS.SQS({
  apiVersion: '2012-11-05',
  region: 'us-east-1'
});
let q = d3.queue();

let execute = true;
if (process.argv.length < 5 || process.argv[4] !== '--execute') {
  console.log ('You didn\'t run it with --execute at the end. Running testy...');
  execute = false;
}

fs.readFile(process.argv[2], function(err, raw) {
  if (err) {
    console.log(err);
    process.exit(2);
  }
  let messages = raw.toString().split('\n').slice(0,-1);
  for (let message of messages) {
    q.defer(sendOne, message);
  }

  q.awaitAll(function(err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    process.exit(0);
  });
});

function sendOne(message, next) {
  let params = {
    MessageBody: `{"Message": "${message}"}`,
    QueueUrl: process.argv[3]
  };

  if (execute) {
    sqs.sendMessage(params, function(err, data) {
      if (err) {
        console.log(err);
        console.log('Could not send message ' + message);
      }
      return next();
    });
  } else {
    console.log(params);
  }
}