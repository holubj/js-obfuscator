function alpha(a, b) {
  return a + b - 3;
}

function beta(c, d) {
  console.log('example');
  return c * d;
}

function test(a, b, c, d, e) {
  console.log(a);
  console.log(b);
  console.log(c);
  console.log(d);
  console.log(e);
}

function s(a, b) {

  function s1(c) {
    console.log(c) + 1;
  }

  function s2(d) {
    console.log(d) - 2;
  }

  s1(a);
  s2(b);
}

alpha(5, 10);
beta(7, 7);
s(100, 200);
