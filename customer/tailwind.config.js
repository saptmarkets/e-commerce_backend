const colors = require("tailwindcss/colors");
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/layout/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],     // 100% of 0.75rem
      'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 100% of 0.875rem
      'base': ['1rem', { lineHeight: '1.5rem' }],    // 100% of 1rem
      'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 100% of 1.125rem
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 100% of 1.25rem
      '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 100% of 1.5rem
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 100% of 1.875rem
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 100% of 2.25rem
      '5xl': ['3rem', { lineHeight: '1' }],          // 100% of 3rem
      '6xl': ['3.75rem', { lineHeight: '1' }],       // 100% of 3.75rem
      '7xl': ['4.5rem', { lineHeight: '1' }],        // 100% of 4.5rem
      '8xl': ['6rem', { lineHeight: '1' }],          // 100% of 6rem
      '9xl': ['8rem', { lineHeight: '1' }],          // 100% of 8rem
    },
    fontFamily: {
      sans: ["saudi_riyal", "Open Sans", "sans-serif"],
      serif: ["Inter", "sans-serif"],
      DejaVu: ["DejaVu Sans", "Arial", "sans-serif"],
    },
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        primary: "#76bd43",
        secondary: "#74368c",
      },
      height: {
        header: "560px",
      },
      backgroundImage: {
        "page-header": "url('/page-header-bg.jpg')",
        "contact-header": "url('/page-header-bg-2.jpg')",
        subscribe: "url('/subscribe-bg.jpg')",
        "app-download": "url('/app-download.jpg')",
        cta: "url('/cta-bg.png')",
        "cta-1": "url('/cta/cta-bg-1.png')",
        "cta-2": "url('/cta/cta-bg-2.png')",
        "cta-3": "url('/cta/cta-bg-3.png')",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
