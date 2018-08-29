'use strict';

function is_node_four() {
  let version = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
  return parseInt(Math.floor(version)) === 4;
}

module.exports = is_node_four;
