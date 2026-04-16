import React, { useState } from 'react';
import { MdAdd, MdClose, MdDelete } from 'react-icons/md';

const TagInput = ({ tags, setTags }) => {
  const [inputvalue, setinputvalue] = useState('');
  const HandleInputChange = (e) => {
    setinputvalue(e.target.value);
  };
  const AddTag = () => {
    if (inputvalue.trim() != '') {
      setTags([...tags, inputvalue.trim()]);
      console.log(tags);
      setinputvalue('');
    }
  };

  const HandleKeyDown = (e) => {
    if (e.key == 'Enter') {
      AddTag();
    }
  };

  const HandleTagRemove = (Tag) => {
    setTags(tags.filter((tag) => tag != Tag));
  };
  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        {tags?.map((tag, index) => {
          return (
            <span
              className="flex items-center gap-2 text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-full"
              key={index}
            >
              # {tag}
              <button onClick={() => HandleTagRemove(tag)} className="ml-1">
                <MdClose />
              </button>
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        <input
          type="text"
          className="text-sm bg-transparent border px-3 py-2 rounded outline-none"
          placeholder="Add Tags"
          value={inputvalue}
          onChange={HandleInputChange}
          onKeyDown={HandleKeyDown}
          name=""
          id=""
        />
        <button className="flex justify-center items-center w-8 h-8 rounded border border-blue-700 hover:bg-blue-700">
          <MdAdd
            onClick={AddTag}
            className="text-2xl text-blue-700 hover:text-white cursor-pointer"
          />
        </button>
      </div>
    </div>
  );
};

export default TagInput;
