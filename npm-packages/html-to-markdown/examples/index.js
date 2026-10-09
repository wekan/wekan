'use strict';

/**
 * html-to-markdown
 * Copyright(c) 2015-2015 Harminder Virk
 * MIT Licensed
*/

var converter = require('../index');

var html = `<div>
  <h2> This is a dummy heading for Lorem guy </h2>
  <h3> I am sub heading buddy </h3>
  <p> This is a paragrap buddy </p>
  <ul>
    <li> This is ul 1 </li>
  </ul>
  <ol>
    <li> This is ol 1 </li>
  </ol>
  <ul>
    <li> This is ul 2 </li>
  </ul>
  <section> This is a section </section>
  <pre>
    var name = "foo";
  </pre>
  <blockquote>
    This is super quote
    In multiple lines
  </blockquote>
  <b> This is bold tag </b>
  <i> Some italic </i>
</div>
`
console.log(converter.convert(html))


var htmlStyled = `
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas auctor ipsum eget quam sagittis, ut fringilla diam aliquam. Nullam malesuada consectetur nisi non ultrices. Cras in purus tincidunt massa egestas viverra sed id ex. Donec nec lectus rutrum, laoreet dui eget, lacinia magna. Nam iaculis dui dolor, non consequat erat ullamcorper et. Fusce mollis magna eu leo placerat finibus. Curabitur et sem pellentesque, faucibus neque quis, laoreet turpis. Phasellus non sem in ipsum accumsan laoreet. Nam ut egestas ex. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nulla luctus ultricies justo. Praesent at nulla eu tortor bibendum vehicula ac sit amet neque.</p>

  <p style="margin-bottom: 0cm; margin-bottom: .0001pt;">Sed a tempus nunc, sit amet sodales enim. In leo odio, interdum vitae venenatis ut, accumsan sit amet sapien. Aliquam suscipit turpis metus, <b>at scelerisque nisl blandit nec. </b><span style="">&nbsp;</span>Nullam id vestibulum elit. Praesent dolor ligula, suscipit non faucibus nec, volutpat eu libero. Sed ornare eros quis lacus maximus ullamcorper. Duis ullamcorper porta nulla, at fermentum urna. Praesent eget lacus efficitur, commodo sapien convallis, mattis ipsum. Nullam at urna quis ipsum porta faucibus a vitae leo. Vestibulum mollis ante vitae risus eleifend, sed tempus sapien fermentum. Fusce vel orci ac metus dignissim sollicitudin.</p>

  <p style="margin-bottom: 0cm; margin-bottom: .0001pt;">Morbi ligula lacus, consequat ac imperdiet ut, blandit eu nulla. Praesent sollicitudin mollis libero, et congue sem scelerisque at. Fusce tincidunt dictum sem sed vehicula. Nam a gravida tortor, vitae scelerisque metus. Duis sed justo lacinia, porta nibh eu, varius tortor. Ut sollicitudin tristique elementum. Aliquam ullamcorper aliquet felis tempus euismod. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Mauris rutrum semper odio non suscipit. Donec aliquam, eros eu fermentum varius, ligula tellus ultrices odio, et auctor sem mi non nisl. Quisque ut volutpat augue, nec porta sem. Fusce quis mauris non diam egestas convallis id at tellus. Ut in pellentesque nisi. Ut viverra at est eu auctor. Donec fermentum interdum aliquet. Pellentesque scelerisque sed leo at vestibulum.</p><p style="margin-bottom: 0cm; margin-bottom: .0001pt;"><br></p>

  <p style="margin-bottom: 0cm; margin-bottom: .0001pt;">Dante Alighieri</p>
`

console.log(converter.convert(htmlStyled))


