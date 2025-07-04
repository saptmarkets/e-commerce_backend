import { Input } from "@windmill/react-ui";

const InputValueFive = ({
  name,
  label,
  type,
  disabled,
  register,
  required,
  maxValue,
  minValue,
  defaultValue,
  placeholder,
  step,
}) => {
  const value = {
    valueAsNumber: true,
    required: required ? `${label} is required!` : false,
    max: {
      value: maxValue,
      message: `Maximum value ${maxValue}!`,
    },
    min: {
      value: minValue,
      message: `Minimum value ${minValue}!`,
    },
    // Allow decimal inputs if step is defined or if it's a number type
    pattern: type === 'number' && step 
      ? {
          value: /^[0-9]*\.?[0-9]*$/,
          message: `Please enter a valid number!`,
        } 
      : {
      value: /^[0-9]*$/,
      message: `Invalid ${label}!`,
    },
    // onBlur: (e) => handleTotalVolume(e.target.value, 'stock'),
  };

  return (
    <>
      <div className={`flex flex-row`}>
        <Input
          {...register(`${name}`, value)}
          name={name}
          type={type}
          disabled={disabled}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="mr-2 p-2"
          step={step}
        />
      </div>
    </>
  );
};

export default InputValueFive;
