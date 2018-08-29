const AWS = require('aws-sdk');
const _ = require("lodash");
const md5 = require('md5');
const uuidv1 = require('uuid/v1');

const listFromString = require('./../utils/listFromString');

const sqs = new AWS.SQS();
const s3 = new AWS.S3();

const id = uuidv1();

async function sendBatchRepositoryToSQS(repositories, execute) {
  let params = {
    QueueUrl: process.env.QueueUrl,
    Entries: repositories.map((repository) => {
      let messageBody = {
        Subject: `git@github.com:${process.env.GITHUB_ORG}/${repository}`,
        Message: id
      };
      return {
        Id: md5(`${repository}`),
        MessageBody: JSON.stringify(messageBody)
      };
    })
  };

  console.log(params);
  if (execute) {
    try {
      await sqs.sendMessageBatch(params).promise();
    } catch (err) {
      console.log(err);
    }
  }
}

exports.handler = async (event) => {
  let params = {
    Bucket: process.env.REPO_BUCKET_SOURCE,
    Key: process.env.REPO_KEY_SOURCE
  };

  const excludeReposList = listFromString(process.env.ExcludeReposList);

  let s3Object = await s3.getObject(params).promise();

  try {
    let repositories = s3Object.Body.toString('utf-8');

    repositories = JSON.parse(repositories);

    repositories = Object.keys(repositories).map((repository) => {
      return repositories[repository];
    });

    repositories = repositories.filter((repository) => {
      return !repository.archived && !repository.fork && !excludeReposList.includes(repository.name);
    });

    repositories = repositories.map((repository) => {
      return repository.name;
    });

    let tasks = [];

    const chunks = _.chunk(repositories, 10);

    for (let chunk of chunks) {
      tasks.push(sendBatchRepositoryToSQS(chunk, true));
    }

    await Promise.all(tasks);
  } catch (err) {
    console.log(err);
    return err;
  }
};
