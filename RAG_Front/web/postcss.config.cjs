module.exports = {
  plugins: [
    require('postcss-import')({
      from: undefined
    }),
    require('tailwindcss/nesting'),
    require('tailwindcss'),
    require('autoprefixer')({
      overrideBrowserslist: ['last 2 versions', 'not IE 11'],
      grid: true
    })
  ]
}