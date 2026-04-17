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
  }, [selectedUserId]);

  function connectToWs() {
    const ws = new WebSocket("wss://mern-chat-backend-g0fl.onrender.com");
    setWs(ws);

    ws.addEventListener('message', handleMessage);

    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('Reconnecting...');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray = []) {
    const people = {};
    (peopleArray || []).forEach(({userId, username}) => {
      if (userId && username) {
        people[userId] = username;
      }
    });
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data || '{}');

    if (messageData?.online) {
      showOnlinePeople(messageData.online);
    }

    if (messageData?.text) {
      if (messageData.sender === selectedUserId) {
        setMessages(prev => [...prev, messageData]);
      }
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
        setMessages(res.data || []);
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
      const data = res.data || [];

      const offlinePeopleArr = data
        .filter(p => p && p._id !== id)
        .filter(p => !(Object.keys(onlinePeople || {}).includes(p._id)));

      const offline = {};
      offlinePeopleArr.forEach(p => {
        if (p && p._id) {
          offline[p._id] = p;
        }
      });

      setOfflinePeople(offline);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/'+selectedUserId).then(res => {
        setMessages(res.data || []);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = {...(onlinePeople || {})};
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages || [], '_id');

  return (
    <div className="flex h-screen">

      {/* LEFT */}
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />

          {(Object.keys(onlinePeopleExclOurUser || {})).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
            />
          ))}

          {(Object.keys(offlinePeople || {})).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId]?.username || ''}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
            />
          ))}
        </div>

        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600">
            {username || ''}
          </span>

          <button onClick={logout} className="text-sm bg-blue-100 py-1 px-2 border rounded-sm">
            logout
          </button>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">

          {!selectedUserId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-300">Select a user</div>
            </div>
          )}

          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute inset-0 bottom-2">

                {(messagesWithoutDupes || []).map(message => (
                  <div key={message._id} className={message.sender === id ? 'text-right' : 'text-left'}>
                    <div className={`inline-block p-2 my-2 rounded-md text-sm ${
                      message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500'
                    }`}>
                      {message.text || ''}

                      {message.file && (
                        <a href={`${axios.defaults.baseURL}/uploads/${message.file}`} target="_blank">
                          {message.file}
                        </a>
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
              value={newMessageText}
              onChange={e => setNewMessageText(e.target.value)}
              className="flex-grow p-2 border"
            />

            <input type="file" onChange={sendFile} />

            <button className="bg-blue-500 text-white p-2">Send</button>
          </form>
        )}
      </div>
    </div>
  );
}