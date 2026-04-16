import React, { useEffect, useState } from 'react';
import TagInput from '../../components/Input/TagInput';
import UseAxiosSecure from '../../Axios/UseAxiosSecure';
import toast from 'react-hot-toast';
// import { useNavigate } from 'react-router';
const AddEditNotes = ({
  noteData,
  type,
  GetAllNotes,
  setType,
  setNotedata,
}) => {
  // const navigate = useNavigate();
  const axiosSecure = UseAxiosSecure();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    if (noteData) {
      setTitle(noteData.title || '');
      setContent(noteData.content || '');
      setTags(noteData.tags || []);
    } else {
      // Clear fields for "add" mode
      setTitle('');
      setContent('');
      setTags([]);
    }
  }, [noteData]);

  const [error, setError] = useState('');
  // console.log(noteData);

  const AddNote = async () => {
    console.log(title, content, tags);
    try {
      const note = { title, content, tags };
      const response = await axiosSecure.post('/api/notes/add-note', note);
      // console.log(response.data.data);
      toast.success('Note Added Successfully');
      GetAllNotes();
      document.getElementById('my_modal_1').close();
    } catch (error) {
      console.log(error);
    }
  };
  const EditNote = async () => {
    console.log(title, content, tags);
    const newnote = { title, content, tags };
    try {
      const response = await axiosSecure.put(
        `/api/notes/edit-note/${noteData?._id}`,
        newnote
      );
      console.log(response);
      toast.success('Note Updated Successfully');
      GetAllNotes();
      setNotedata(null);
      setType('add');
      setTitle('');
      setContent('');
      setTags([]);
      document.getElementById('my_modal_1').close();
    } catch (error) {
      console.log(error);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    console.log(title, content, tags);
    // Add logic to submit note
    if (type == 'add') {
      AddNote();
    }
    if (type == 'edit') {
      EditNote();
    }
  };
  return (
    <dialog id="my_modal_1" className="modal">
      <div className="modal-box ">
        <div className="flex flex-col gap-2">
          <label className="input-label">TITLE</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl text-slate-600 outline-none"
            placeholder="Go to Gym at 5"
          />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <label className="input-label">CONTENT</label>
          <textarea
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm text-slate-900 outline-none bg-slate-50 p-2 rounded"
            placeholder="Content"
            rows={10}
          />
        </div>
        {/* Tags */}
        <div className="mt-3">
          <label className="input-label">TAGS</label>
          <TagInput tags={tags} setTags={setTags} />
        </div>
        {error && <p className="text-red-500 text-xs py-1">{error}</p>}
        {type == 'add' && (
          <button
            onClick={handleSubmit}
            className="btn-primary font-medium mt-5 p-3"
          >
            ADD
          </button>
        )}
        {type == 'edit' && (
          <button
            onClick={handleSubmit}
            className="btn-primary font-medium mt-5 p-3"
          >
            UPDATE
          </button>
        )}
      </div>
    </dialog>
  );
};

export default AddEditNotes;
