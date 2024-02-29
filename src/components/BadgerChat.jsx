import { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import BadgerChatroomScreen from './screens/BadgerChatroomScreen';
import BadgerRegisterScreen from './screens/BadgerRegisterScreen';
import BadgerLoginScreen from './screens/BadgerLoginScreen';
import BadgerLandingScreen from './screens/BadgerLandingScreen';
import BadgerLogoutScreen from './screens/BadgerLogoutScreen';
import BadgerSignOutScreen from './screens/BadgerSignOutScreen';


const ChatDrawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const hardcodedBadgerID = "bid_c1beefa3ab45c1f441c224e4bfcbf642ec2ef755ed57d79384acbad0584b4de9";
  const [isGuest, setIsGuest] = useState(false);
  //const navigation = useNavigation();

  //Pulled from HW6

  useEffect(() => {
    const fetchChatrooms = async () => {
      try {
        const response = await fetch('https://cs571.org/api/f23/hw9/chatrooms', {
          method: 'GET',
          headers: {
            "X-CS571-ID": hardcodedBadgerID,
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          const data = await response.json();
          setChatrooms(data)
          console.log(data)
        } else {
          console.error("Error while fetching Chatrooms");
        }
      } catch (error) {
        console.error("Error during Chatrooms fetch", error);
      }
    };
    fetchChatrooms();
  }, []);

  useEffect(() => {
    console.log('isLoggedIn updated:', isLoggedIn);
  }, [isLoggedIn]);

  async function handleLogin(username, password) {

    //Pulled from HW6
    try {
      const response = await fetch('https://cs571.org/api/f23/hw9/login', {
        method: 'POST',
        headers: {
          "X-CS571-ID": hardcodedBadgerID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        //Alert.alert('LOGIN SUCCESSFUL', 'yay');
        const { token } = data;
        console.log(data)
        await Promise.all([
          SecureStore.setItemAsync('token', token),
          SecureStore.setItemAsync('username', username),
        ]);
        setIsLoggedIn(true)
      } else if (response.status === 401) {
        Alert.alert('Incorrect Password or Username!', 'Try again.')
      } else {
        console.error('Login failed');
        Alert.alert('Incorrect Login', 'Incorrect username or password. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }

  console.log(isLoggedIn)

  async function handleSignup(username, password, repeatPassword) {

    if (!password) {
      Alert.alert('Please enter a password!');
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert('Passwords do not match!');
      return;
    }

    //Pulled from HW6
    try {
      const response = await fetch('https://cs571.org/api/f23/hw9/register', {
        method: 'POST',
        headers: {
          "X-CS571-ID": hardcodedBadgerID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        const { token } = data;
        await Promise.all([
          SecureStore.setItemAsync('token', token),
          SecureStore.setItemAsync('username', username),
        ]);
      } else if (response.status === 409) {
        Alert.alert('Username taken!');
      } else {
        console.error('Register failed');
        Alert.alert('Incorrect Register', 'Incorrect username or password. Please try again.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }

  function handleLogout(navigation) {
    SecureStore.deleteItemAsync('token')
      .then(() => {
        setIsLoggedIn(false);
        navigation.navigate('BadgerLoginScreen');
      })
  }

  const LogoutComponent = ({ handleLogout }) => {
    return <BadgerLogoutScreen handleLogout={handleLogout} />;
  };

  function handleGuest() {
    //Alert.alert("GUEST");
    setIsLoggedIn(true);
    setIsGuest(true);
  }

  const GuestComponent = ({ handleGuest }) => {
    return <BadgerLoginScreen handleGuest={handleGuest} />
  }

  function handleSignOut(navigation) {
    //Alert.alert("SignOut");
    setIsRegistering(true);
    setIsLoggedIn(false);
  }
  const SignOutComponenet = ({ handleSignOut }) => {
    return <BadgerSignOutScreen handleSignOut={handleSignOut} />
  }

  if (isGuest) {
    return (
      <NavigationContainer>
        <ChatDrawer.Navigator>
          <ChatDrawer.Screen name="Landing" component={BadgerLandingScreen} />
          {
            chatrooms.map(chatroom => {
              return <ChatDrawer.Screen key={chatroom} name={chatroom}>
                {(props) => <BadgerChatroomScreen name={chatroom} />}

              </ChatDrawer.Screen>
            })
          }
          <ChatDrawer.Screen name="Sign Up">
            {(props) => <SignOutComponenet handleSignOut={handleSignOut} {...props} />}
          </ChatDrawer.Screen>
          <ChatDrawer.Screen name="s" component={BadgerRegisterScreen}
            options={{
              title: '',
              headerShown: false,
            }}
          />
        </ChatDrawer.Navigator>
      </NavigationContainer>
    );
  }

  if (isLoggedIn) {
    return (
      <NavigationContainer>
        <ChatDrawer.Navigator>
          <ChatDrawer.Screen name="Landing" component={BadgerLandingScreen} />
          {
            chatrooms.map(chatroom => {
              return <ChatDrawer.Screen key={chatroom} name={chatroom}>
                {(props) => <BadgerChatroomScreen name={chatroom} />}
              </ChatDrawer.Screen>
            })
          }
          <ChatDrawer.Screen name="Logout">
            {(props) => <LogoutComponent handleLogout={handleLogout} {...props} />}
          </ChatDrawer.Screen>
        </ChatDrawer.Navigator>
      </NavigationContainer>
    );
  } else if (isRegistering) {
    return <BadgerRegisterScreen handleSignup={handleSignup} setIsRegistering={setIsRegistering} />
  } else {
    return <BadgerLoginScreen handleLogin={handleLogin} setIsRegistering={setIsRegistering} handleGuest={handleGuest} />
  }
}