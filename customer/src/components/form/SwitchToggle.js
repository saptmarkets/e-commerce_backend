import Switch from "react-switch";
import useTranslation from 'next-translate/useTranslation';

const SwitchToggle = ({ id, title, handleProcess, processOption }) => {
  const { t, lang } = useTranslation();
  
  // Translation function
  const tr = (en, ar) => {
    const key = 'common:' + en.replace(/\s+/g, '').replace(/[^a-zA-Z]/g, '');
    const translated = t(key);
    if (translated === key) {
      return lang === 'ar' ? (ar || en) : en;
    }
    return translated;
  };

  return (
    <>
      <div className={`${"mb-3"}`}>
        <div className="flex flex-wrap items-center">
          <label className="text-sm font-semibold text-gray-600 mr-1">
            {title}
          </label>

          <Switch
            id={id || title || ""}
            onChange={handleProcess}
            checked={processOption}
            className="react-switch md:ml-0 ml-3"
            uncheckedIcon={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: 14,
                  color: "white",
                  paddingRight: 5,
                  paddingTop: 1,
                }}
              >
                {tr('No', 'لا')}
              </div>
            }
            width={80}
            height={30}
            handleDiameter={28}
            offColor="#E53E3E"
            onColor="#2F855A"
            checkedIcon={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  fontSize: 14,
                  color: "white",
                  paddingLeft: 8,
                  paddingTop: 1,
                }}
              >
                {tr('Yes', 'نعم')}
              </div>
            }
          />
        </div>
      </div>
    </>
  );
};

export default SwitchToggle;
