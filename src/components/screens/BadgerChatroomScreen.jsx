import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput } from "react-native";
import { useState, useEffect } from "react";
import BadgerChatMessage from "../helper/BadgerChatMessage";
import * as SecureStore from 'expo-secure-store';
import { ScrollView } from "react-native-gesture-handler";


function BadgerChatroomScreen(props) {

  const [messages, setMessages] = useState([]);
  const hardcodedBadgerID = "bid_c1beefa3ab45c1f441c224e4bfcbf642ec2ef755ed57d79384acbad0584b4de9";
  const [activePage, setActivePage] = useState(1);
  const totalPages = 4;


  //Plugged fetchMessages into ChatGPT to debug, and it finally fixed the render issue, by refactoring the code
  //so that fetchMessages is defined outside of the useEffect
  const fetchMessages = async (page) => {
    try {
      const response = await fetch(`https://cs571.org/api/f23/hw9/messages?chatroom=${props.name}&page=${page}`, {
        method: 'GET',
        headers: {
          "X-CS571-ID": hardcodedBadgerID,
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      } else {
        console.error("Error while fetching Messages");
        console.log(response);
      }
    } catch (error) {
      console.error("Error during Messages fetch", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        await fetchMessages(activePage, token);
        // fetchUsername();
      } catch (error) {
        console.error("Error while fetching token/username", error);
      }
    };

    fetchData();
  }, [activePage, props.name]);

  const handlePreviousPage = () => {
    if (activePage > 1) {
      setActivePage(activePage - 1);
    }
  };

  const handleNextPage = () => {
    if (activePage < totalPages) {
      setActivePage(activePage + 1);
    }
  };

  //console.log(messages);


  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [jwtToken, setJwtToken] = useState("")
  const [storedUsername, setStoredUsername] = useState("");

  useEffect(() => {
    SecureStore.getItemAsync("username").then((username) => {
      setStoredUsername(username)
    })
  })

  useEffect(() => {
    SecureStore.getItemAsync("token").then((jwtToken) => {
      setJwtToken(jwtToken)
    })
  })

  const [newMessagePosted, setNewMessagePosted] = useState(false);
  const [messageDeleted, setMessageDeleted] = useState(false);


  const handlePost = async () => {
    try {

      if (!postTitle || !postContent) {
        alert("You must provide both a title and content.");
        return;
      }

      const requestBody = {
        title: postTitle,
        content: postContent,
      };

      const response = await fetch(`https://cs571.org/api/f23/hw9/messages?chatroom=${props.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CS571-ID": hardcodedBadgerID,
          "Authorization": `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.msg);

        if (data.id) {
          setNewMessagePosted(true);
          setPostTitle("");
          setPostContent("");
          setModalVisible(false);
        }
      } else {
        throw new Error("Guests are not allowed to post!");
      }
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    if (newMessagePosted) {
      fetchMessages(1);
      setNewMessagePosted(false);
    }
  }, [newMessagePosted]);

  const handleDeletePost = (messageId) => {
    fetch(`https://cs571.org/api/f23/hw9/messages?id=${messageId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CS571-ID": hardcodedBadgerID,
        "Authorization": `Bearer ${jwtToken}`,
      }
    })
      .then(res => res.json())
      .then(data => {
        alert("Successfully deleted the post!")
        fetchMessages(1)
      })
  }

  //Thank you Hongtao Hao
  return (<View style={{ flex: 1 }}>
    {
      messages.length === 0 ?
        <View><Text>Nothing in here now</Text></View>
        :
        <ScrollView>
          {
            messages.map(m => <BadgerChatMessage key={m.id} {...m} handleDeletePost={handleDeletePost} deletable={storedUsername === m.poster}></BadgerChatMessage>)
          }
        </ScrollView>
    }
    {/* Plugged the View and TouchableOpacity below into ChatGPT to modify the logic so that the color of the
    Button turns grey, indicating that its disabled */}
    <View style={styles.paginationContainer}>
      <TouchableOpacity onPress={handlePreviousPage} disabled={activePage === 1}>
        <Text style={[styles.paginationButton, { color: activePage === 1 ? 'grey' : 'blue' }]}>Previous</Text>
      </TouchableOpacity>
      <Text style={styles.currentPageText}>Page {activePage}</Text>
      <TouchableOpacity onPress={handleNextPage} disabled={activePage === totalPages}>
        <Text style={[styles.paginationButton, { color: activePage === totalPages ? 'grey' : 'blue' }]}>Next</Text>
      </TouchableOpacity>
    </View>
    {messages.length === 0 && (
      <View>
        <Text>There's nothing here!</Text>
      </View>
    )}
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
      }}
    >
      <View style={{ marginTop: 22 }}>
        <View>
          <Text>Post Title:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setPostTitle(text)}
            value={postTitle}
          />
          <Text>Post Content:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setPostContent(text)}
            value={postContent}
          />
          <TouchableOpacity onPress={handlePost} disabled={isPosting}>
            <Text style={[styles.paginationButton, { color: isPosting ? 'grey' : 'blue' }]}>Create Post</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.paginationButton}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    {/* Add ifGuest? Statement */}
    <TouchableOpacity onPress={() => setModalVisible(true)}>
      <Text style={styles.paginationButton}>Create Post</Text>
    </TouchableOpacity>
  </View>
  );
}

//Got the Pagination Container and Button styles from ChatGPT
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paginationButton: {
    color: 'blue',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 7,
  },
  currentPageText: {
    fontSize: 16,
  },

  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default BadgerChatroomScreen;