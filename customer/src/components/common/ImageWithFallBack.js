const { default: Image } = require("next/image");
const { useEffect, useState } = require("react");

const fallbackImage =
  "https://res.cloudinary.com/dxjobesyt/image/upload/v1752706908/placeholder_kvepfp_wkyfut.png";

const ImageWithFallback = ({
  fallback = fallbackImage,
  alt,
  src,
  ...props
}) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
  }, [src]);

  return (
    <Image
      alt={alt}
      onError={setError}
      src={error ? fallbackImage : src}
      {...props}
      fill
      style={{
        objectFit: "contain",
      }}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-contain transition duration-150 ease-linear transform group-hover:scale-105 p-2"
    />
  );
};

export default ImageWithFallback;
