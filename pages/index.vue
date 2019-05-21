<template>
  <div id="hello">
    <h1>Hello. <span>I'm Daniel.</span></h1>
    <br />
    <h2>SOFTWARE ENGINEER, WEB ENTHUSIAST, EAGER LEARNER</h2>
  </div>
</template>

<style lang="scss">
$primary: #00f3f3;

#hello {
  border-radius: 1rem;
  height: 100%;
  margin: 0 0 2rem 0;
  padding: 2rem 0;
  color: white;
  line-height: 1.8rem;
}

h1 {
  display: inline-block;
  margin-bottom: 1rem;
  line-height: 5rem;
  font-size: 3.5rem;
  border-bottom: 4px solid $primary;

  span {
    white-space: nowrap;
  }
}

h2 {
  margin-top: 1rem;
  font-weight: 400;
  font-size: 1.6rem;
}
</style>
