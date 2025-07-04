import React from 'react';
import ReactTagInput from '@pathofdev/react-tag-input';

const Tags = ({ tag, setTag }) => {
  return (
    <ReactTagInput
      placeholder="Product Tag (Write then press enter to add new tag)"
      tags={tag}
      onChange={(newTags) => setTag(newTags)}
    />
  );
};

export default Tags; 