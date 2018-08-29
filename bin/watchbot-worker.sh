#!/bin/sh

eval $(./node_modules/.bin/decrypt-kms-env) > /dev/null 2>&1

mkdir ~/.ssh
touch ~/.ssh/id_rsa
touch ~/.ssh/id_rsa.pub
chmod 600 ~/.ssh/id_rsa
echo $SSHKey | base64 --decode --ignore-garbage > ~/.ssh/id_rsa
echo "    BatchMode yes" >> /etc/ssh/ssh_config
ssh-keygen -f ~/.ssh/id_rsa -y > ~/.ssh/id_rsa.pub

ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null

secret-shield --redact 5 --repository $Subject -o json -C minimal --run-id $Message
