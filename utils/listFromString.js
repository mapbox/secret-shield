'use strict';

function listFromString(stringList) {
  if (stringList === null || stringList === undefined) {
    return [];
  }

  stringList = stringList.trim();
  if (stringList === '') {
    return [];
  }

  let list = stringList.split(',');

  list = list.map((value) => {
    return value.trim();
  });

  return list;
}

module.exports = listFromString;
