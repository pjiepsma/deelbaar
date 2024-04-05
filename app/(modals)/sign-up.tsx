import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useRef } from "react";
import { useAuth } from "@/app/auth/auth";
import Colors from "@/constants/Colors";

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();

  const emailRef = useRef("");
  const passwordRef = useRef("");
  const userNameRef = useRef("");

  return (
    <>
      <Stack.Screen options={{ title: "Sign up", headerShown: true }} />
      <View style={styles.container}>
        <View>
          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subTitle}>Please enter your details</Text>
        </View>
        <View>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            placeholder="Enter your name"
            autoCapitalize="none"
            nativeID="userName"
            onChangeText={(text) => {
              userNameRef.current = text;
            }}
            style={styles.textInput}
          />
        </View>
        <View>
          <Text style={styles.label}>Your Email</Text>
          <TextInput
            placeholder="Enter your email"
            autoCapitalize="none"
            nativeID="email"
            onChangeText={(text) => {
              emailRef.current = text;
            }}
            style={styles.textInput}
          />
        </View>
        <View>
          <Text style={styles.label}>Create Password</Text>
          <TextInput
            placeholder="Enter your password"
            secureTextEntry={true}
            nativeID="password"
            onChangeText={(text) => {
              passwordRef.current = text;
            }}
            style={styles.textInput}
          />
        </View>

        <TouchableOpacity
          onPress={async () => {
            const { data, error } = await signUp(
              emailRef.current,
              passwordRef.current,
              userNameRef.current,
            );
            if (data) {
              router.replace("/");
            } else {
              console.log(error);
            }
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 26,
  },
  label: {
    marginBottom: 4,
    color: Colors.grey,
  },
  title: {
    color: Colors.grey,
    fontSize: 20,
    fontWeight: "600",
  },
  subTitle: {
    color: "#434347",
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 16,
  },
  textInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "#455fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 10,
    width: "100%",
    borderRadius: 5,
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
});
