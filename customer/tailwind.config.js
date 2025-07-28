const colors = require("tailwindcss/colors");
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/layout/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    fontSize: {
      'xs': ['0.71rem', { lineHeight: '1rem' }],     // 95% of 0.75rem
      'sm': ['0.836rem', { lineHeight: '1.25rem' }], // 95% of 0.875rem
      'base': ['0.95rem', { lineHeight: '1.5rem' }], // 95% of 1rem
      'lg': ['1.08rem', { lineHeight: '1.75rem' }],  // 95% of 1.125rem
      'xl': ['1.14rem', { lineHeight: '1.75rem' }],  // 95% of 1.25rem
      '2xl': ['1.425rem', { lineHeight: '2rem' }],   // 95% of 1.5rem
      '3xl': ['1.71rem', { lineHeight: '2.25rem' }], // 95% of 1.875rem
      '4xl': ['2.28rem', { lineHeight: '2.5rem' }],  // 95% of 2.25rem
      '5xl': ['2.85rem', { lineHeight: '1' }],       // 95% of 3rem
      '6xl': ['3.42rem', { lineHeight: '1' }],       // 95% of 3.75rem
      '7xl': ['4.275rem', { lineHeight: '1' }],      // 95% of 4.5rem
      '8xl': ['5.7rem', { lineHeight: '1' }],        // 95% of 6rem
      '9xl': ['7.6rem', { lineHeight: '1' }],        // 95% of 8rem
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
