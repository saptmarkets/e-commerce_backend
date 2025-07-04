# Arabic Language Support

To enable Arabic language support in your application, follow these steps:

## 1. Ensure Arabic is properly added in the database

1. Go to **International** > **Languages** in the admin panel
2. If Arabic is not listed, click **Add Language** and enter the following details:
   - **Language Name**: Arabic
   - **ISO Code**: ar
   - **Language Code**: ar
   - **Flag**: SA (Saudi Arabia) or other appropriate country
   - **Published**: Yes (toggle to Show)
3. Click **Add** to save the language

## 2. Verify files are in place

The following files have been added/modified:
- `src/utils/translation/ar.json` - Arabic translations
- `src/i18n.js` - Updated to include Arabic
- `src/index.css` - Added RTL support
- `src/context/SidebarContext.jsx` - Updated to handle RTL

## 3. Restart the application

After adding Arabic to the database, restart the application:

```bash
npm run dev
```

## 4. Test language switching

1. Go to the admin panel
2. Click on the language dropdown in the header
3. Select Arabic
4. The UI should switch to Arabic and display in right-to-left (RTL) format

## 5. Troubleshooting

If Arabic language switching is not working:

1. Check browser console for errors
2. Verify that Arabic is listed in the language dropdown
3. Make sure the Arabic language is set to "Show" in the database
4. Check that the i18next cookie is being set correctly
5. Verify that the RTL styling is working properly

## 6. Adding more translations

To add more Arabic translations:
1. Edit the `src/utils/translation/ar.json` file
2. Add new key-value pairs for the UI elements you want to translate
3. Restart the application to see the changes

Alternatively, enable auto-translation in Settings to automatically translate content using the MyMemory API.

## 7. RTL Support

Arabic is a right-to-left language. RTL support has been added to ensure proper display of Arabic text.
The application will automatically switch to RTL mode when Arabic is selected.

---

For more information, see `src/utils/addArabicLanguage.js`