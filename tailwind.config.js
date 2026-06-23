/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Màu VSTEP
        'vstep': {
          DEFAULT: '#0EACD8',
          light: '#4FC3F7',
          dark: '#0A8BB0',
          lighter: '#E6F6FB',
        },
        
        // Màu chủ đạo - Chỉ 3 mức độ
        primary: {
          light: '#0FAFD4',
          DEFAULT: '#0FB0D1',
          dark: '#0DA2E7',
        },
        
        // Màu nền
        background: {
          white: '#FFFFFF',
          light: '#F3F4F6',
        },
        
        // Màu chữ - Chỉ 1 màu
        text: {
          dark: '#1F2937',
        },
        
        // Màu phụ
        success: {
          light: '#22C55E',
          DEFAULT: '#16A34A',
        },
        
        warning: {
          light: '#F59E0B',
          DEFAULT: '#D97706',
        },
      },
      
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.10)',
      },
      
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0FB0D1 0%, #0DA2E7 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-vstep': 'linear-gradient(135deg, #0EACD8 0%, #4FC3F7 100%)',
      },
    },
  },
  plugins: [],
}