<template>
  <div id="sky-map"></div>
</template>

<script>
import * as d3 from 'd3'
import stars from '~/assets/stars.json'
import constellations from '~/assets/constellations.json'

function glow(selection) {
  const filter = selection
    .append('defs')
    .append('filter')
    .attr('id', 'glow')
    .attr('width', '300%')
    .attr('height', '300%')
    .attr('x', '-100%')
    .attr('y', '-100%')

  filter
    .append('feGaussianBlur')
    .attr('result', 'blurred')
    .attr('stdDeviation', '2')

  const feMerge = filter.append('feMerge')

  feMerge.append('feMergeNode').attr('in', 'blurred')

  feMerge.append('feMergeNode').attr('in', 'SourceGraphic')
}

export default {
  data() {
    return {
      stars,
      constellations
    }
  },
  mounted() {
    function star(el) {
      el.append('circle')
        .classed('star', true)
        .style('fill', 'white')
        .style('filter', 'url(#glow)')
        .style('opacity', 0.1)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.r)
    }

    function link(el) {
      el.append('line')
        .classed('link', true)
        .attr('stroke', 'white')
        .attr('stroke-width', 0.5)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('vector-effect', 'non-scaling-stroke')
        .style('opacity', 0.1)
        .attr('x1', d => d.x1)
        .attr('y1', d => d.y1)
        .attr('x2', d => d.x2)
        .attr('y2', d => d.y2)
    }

    const svg = d3
      .select('#sky-map')
      .append('svg')
      .attr('viewBox', '0 0 1000 1000')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .call(glow)

    // Stars
    svg
      .selectAll('circle.star')
      .data(stars)
      .enter()
      .call(star)

    // Links
    svg
      .selectAll('line.link')
      .data(constellations)
      .enter()
      .call(link)

    // Blink animation
    function blinkStar() {
      const randomNumber = Math.round(d3.randomUniform(1, stars.length)())
      d3.select(`.star:nth-child(${randomNumber})`)
        .transition()
        .duration(1000)
        .style('opacity', 1)
        .transition()
        .delay(1000)
        .style('opacity', 0.1)
    }

    const blinkNumber = 10
    for (let i = 1; i < blinkNumber; i++) setInterval(blinkStar, i * 300 + 2000)
  }
}
</script>

<style lang="scss" scoped>
#sky-map {
  margin: 0;
  padding: 2rem 1rem 0 1rem;
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &::after {
    content: '';
    background: radial-gradient(ellipse at bottom, #1c2837 0%, #050608 100%);
    background-attachment: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
    z-index: -1;
  }
}
</style>
