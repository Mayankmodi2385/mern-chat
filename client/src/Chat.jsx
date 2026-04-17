import {useContext, useEffect, useRef, useState} from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import {UserContext} from "./UserContext.jsx";
import {uniqBy} from "lodash";
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
  const [ws,setWs] = useState(null);
  const [onlinePeople,setOnlinePeople] = useState({});
  const [offlinePeople,setOfflinePeople] = useState({});
  const [selectedUserId,setSelectedUserId] = useState(null);
  const [newMessageText,setNewMessageText] = useState('');
  const [messages,setMessages] = useState([]);
  const {username,id,setId,setUsername} = useContext(UserContext);
  const divUnderMessages = useRef();

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket(import.meta.env.VITE_API_URL.replace('https','wss'));
    setWs(ws);

    ws.addEventListener('message', handleMessage);

    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('Disconnected. Reconnecting...');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({userId,username}) => {
      if (userId) {
        people[userId] = username;
      }
    });
    setOnlinePeople(people);
  }
function handleMessage(ev) {
  const messageData = JSON.parse(ev.data);

  if ('online' in messageData) {
    showOnlinePeople(messageData.online);
  } 
  else if ('text' in messageData) {
    // ✅ ALWAYS push message (fix)
    setMessages(prev => ([...prev, messageData]));
  }
}

  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  function sendMessage(ev, file = null) {
    if (ev) ev.preventDefault();

    if (!ws) return;

    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
      file,
    }));

    if (file) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data);
      });
    } else {
      setNewMessageText('');
      setMessages(prev => ([...prev,{
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      }]));
    }
  }

  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);

    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({behavior:'smooth', block:'end'});
    }
  }, [messages]);

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArr = res.data
        .filter(p => p._id !== id)
        .filter(p => !Object.keys(onlinePeople).includes(p._id));

      const offlinePeople = {};
      offlinePeopleArr.forEach(p => {
        offlinePeople[p._id] = p;
      });

      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = {...onlinePeople};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, '_id');

  return (
    <div className="flex h-screen">
      {/* LEFT SIDE */}
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />

          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
            />
          ))}

          {Object.keys(offlinePeople).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
            />
          ))}
        </div>

        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600">{username}</span>
          <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 border rounded-sm">
            logout
          </button>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">

          {!selectedUserId && (
            <div className="flex h-full items-center justify-center text-gray-300">
              ← Select a user
            </div>
          )}

          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute inset-0 bottom-2">

                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={message.sender === id ? 'text-right':'text-left'}>
                    <div className={
                      "inline-block p-2 my-2 rounded-md text-sm " +
                      (message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')
                    }>
                      {message.text}

                      {message.file && (
                        <div>
                          <a target="_blank"
                             href={axios.defaults.baseURL + '/uploads/' + message.file}>
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>

        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={ev => setNewMessageText(ev.target.value)}
              placeholder="Type message"
              className="bg-white flex-grow border rounded-sm p-2"
            />

            <label className="bg-blue-200 p-2 cursor-pointer rounded-sm">
              <input type="file" className="hidden" onChange={sendFile} />
              📎
            </label>

            <button className="bg-blue-500 p-2 text-white rounded-sm">
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}