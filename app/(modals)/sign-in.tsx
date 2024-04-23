import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useRef } from "react";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { defaultStyles } from "@/constants/Styles";
import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSignInAccount } from "@/lib/query/auth";

export default function SignIn() {
  useWarmUpBrowser();

  const { mutateAsync: signIn } = useSignInAccount();
  const router = useRouter();

  const emailRef = useRef("");
  const passwordRef = useRef("");

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subTitle}>Please enter your credentials</Text>
      </View>
      <View>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="email"
          autoCapitalize="none"
          nativeID="email"
          onChangeText={(text) => {
            emailRef.current = text;
          }}
          style={styles.textInput}
        />
      </View>
      <View>
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="password"
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
          const user = await signIn({
            email: emailRef.current,
            password: passwordRef.current,
          });
          if (user) {
            router.replace("/");
          } else {
            console.log(user);
          }
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <View style={{ marginTop: 32, flex: 1, flexDirection: "row" }}>
        <Text style={{ fontWeight: "500" }}>Don' t have an account?</Text>
        <Text
          style={{ fontWeight: "500", color: Colors.primary, marginLeft: 8 }}
          onPress={() => router.push("/sign-up")}
        >
          Sign up
        </Text>
      </View>
      <View style={styles.separatorView}>
        <View style={styles.separatorLine}></View>
        <Text style={styles.separatorText}>or</Text>
        <View style={styles.separatorLine}></View>
      </View>
      <View style={{ gap: 20 }}>
        {/*<TouchableOpacity style={styles.btnOutline} onPress={() => signIn()}>*/}
        {/*  <Ionicons*/}
        {/*    style={defaultStyles.btnIcon}*/}
        {/*    name="logo-google"*/}
        {/*    size={24}*/}
        {/*    color="#000"*/}
        {/*  />*/}
        {/*  <Text style={styles.btnOutlineText}>Continue with Google</Text>*/}
        {/*</TouchableOpacity>*/}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 26,
  },
  separatorView: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginVertical: 30,
  },
  separatorText: {
    fontFamily: "mon-sb",
    color: Colors.grey,
  },
  separatorLine: {
    borderBottomColor: "#ABABAB",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.grey,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  btnOutlineText: {
    color: "#000",
    fontSize: 16,
    fontFamily: "mon-sb",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "mon-b",
  },

  label: {
    marginBottom: 4,
    color: "#455fff",
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
});
