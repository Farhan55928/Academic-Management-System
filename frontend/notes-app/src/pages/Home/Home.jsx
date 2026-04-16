import { MdAdd } from 'react-icons/md';
import NoteCard from '../../components/Cards/NoteCard';
import Navbar from '../../components/Navbar/Navbar';
import AddEditNotes from './AddEditNotes';
import { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router';
import UseAxiosSecure from '../../Axios/UseAxiosSecure';
import moment from 'moment';
import toast from 'react-hot-toast';

const Home = () => {
  const [Allnotes, SetAllnotes] = useState([]);
  const [type, setType] = useState('add');
  const [notedata, setNotedata] = useState(null);
  const [userinfo, setUserinfo] = useState(null);
  // const navigate = useNavigate();
  const axiosSecure = UseAxiosSecure();

  const HandleEdit = (note) => {
    setType('edit');
    setNotedata(note);
    document.getElementById('my_modal_1').showModal();
    // return (
    //   <AddEditNotes GetAllNotes={GetAllNotes} type={'add'} noteData={note} />
    // );
  };
  const HandleDelete = async (note) => {
    try {
      const response = await axiosSecure.delete(
        `/api/notes/delete-note/${note._id}`
      );
      console.log(response);
      toast.success('Note Deleted Successfully');
      GetAllNotes();
    } catch (error) {
      console.log(error);
    }
  };

  const HandlePinNote = async (note) => {
    try {
      const response = await axiosSecure.put(
        `/api/notes/update-note-pinned/${note._id}`
      );
      const newnote = response.data.data.note;
      if (newnote?.isPinned) {
        toast.success('Note Pinned Successfully');
      } else {
        toast.success('Note Pin Removed Successfully');
      }
      GetAllNotes();
    } catch (error) {
      console.log(error);
    }
  };

  // Get User info
  const getUserInfo = async () => {
    try {
      const response = await axiosSecure.get('/api/users/get-user');
      const result = response.data;
      console.log(`Successful Get User`, result.data.user);
      setUserinfo(result.data.user);
    } catch (error) {
      console.log(error);
    }
  };

  // Get All notes
  const GetAllNotes = async () => {
    try {
      const response = await axiosSecure.get('/api/notes/get-all-notes');
      console.log(`Successful Get All Notes`, response.data.data.notes);
      SetAllnotes(response.data.data.notes);
    } catch (error) {
      console.log(error.response);
    }
  };

  useEffect(() => {
    getUserInfo();
    GetAllNotes();
    return () => {};
  }, []);
  // console.log(Allnotes);
  return (
    <>
      <Navbar userinfo={userinfo} />
      <div className="container w-11/12 mx-auto">
        <div className="grid grid-cols-3 gap-4 mt-8 ">
          {Allnotes.map((note, index) => {
            return (
              <NoteCard
                key={index}
                title={note.title}
                isPinned={note.isPinned}
                date={moment(note.createdAt).format('Do MMM YYYY')}
                content={note.content}
                tags={note.tags}
                onEdit={() => {
                  HandleEdit(note);
                }}
                onDelete={() => {
                  HandleDelete(note);
                }}
                onPinNote={() => {
                  HandlePinNote(note);
                }}
              />
            );
          })}
        </div>
        <button
          className="w-16 h-16 flex justify-center items-center rounded-2xl bg-primary hover:bg-blue-500 transition-all ease-in-out duration-300 absolute right-10 bottom-10"
          onClick={() => document.getElementById('my_modal_1').showModal()}
        >
          <MdAdd className="text-[32px] text-white" />
        </button>
        <AddEditNotes
          noteData={notedata}
          GetAllNotes={GetAllNotes}
          type={type}
          setNotedata={setNotedata}
          setType={setType}
        />
        {/* <button className="w-16 h-16 flex justify-center items-center rounded-2xl bg-primary hover:bg-blue-500 transition-all ease-in-out duration-300 absolute right-10 bottom-10">
          <MdAdd className="text-[32px] text-white" />
        </button> */}
      </div>
    </>
  );
};

export default Home;
