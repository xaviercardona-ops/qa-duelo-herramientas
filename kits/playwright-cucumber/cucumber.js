// Configuración del ejecutor Cucumber: dónde están los escenarios, el soporte y los pasos, y qué informes deja.
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['features/soporte/**/*.js', 'features/pasos/**/*.js'],
    // Los escenarios con la etiqueta @pendiente se saltan: quítasela a cada uno cuando empieces a implementarlo.
    tags: 'not @pendiente',
    format: ['progress', 'html:informe/cucumber.html'],
  },
};
