function mergeSort(arr) {
  if (arr.length === 1) {
    return arr;
  }

  var middle = Math.floor(arr.length / 2);
  var left = arr.slice(0, middle);
  var right = arr.slice(middle);

  return merge(mergeSort(left), mergeSort(right))
}

function merge(left, right) {
  var result = [];
  var indexLeft = 0;
  var indexRight = 0;

  while (indexLeft < left.length && indexRight < right.length) {
    if (left[indexLeft] < right[indexRight]) {
      result.push(left[indexLeft]);
      indexLeft++;
    } else {
      result.push(right[indexRight]);
      indexRight++;
    }
  }

  return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight));
}

var list = [2, 5, 1, 3, 7, 2, 3, 8, 6, 3];
console.log(mergeSort(list));
