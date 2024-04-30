import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useRef } from "react";
import { useUserContext } from "@/app/auth/auth";
import Colors from "@/constants/Colors";
import { createUserAccount } from "@/lib/appwrite/user";
import { useCreateUserAccount, useSignInAccount } from "@/lib/query/auth";
import { toast } from "@/lib/toast";

export default function SignUp() {
  const router = useRouter();

  const { mutateAsync: createUserAccountisCreatingAccount } =
    useCreateUserAccount();
  const { mutateAsync: signInAccount } = useSignInAccount();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  const emailRef = useRef("");
  const passwordRef = useRef("");
  const userNameRef = useRef("");
  const nameRef = useRef("");

  const handleSignup = async (user: any) => {
    try {
      const newUser = await createUserAccount(user);

      if (!newUser) {
        // toast({ title: "Sign up failed. Please try again." });

        return;
      }

      const session = await signInAccount({
        email: user.email,
        password: user.password,
      });

      if (!session) {
        // toast({ title: "Something went wrong. Please login your new account" });

        // navigate("/sign-in");

        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        router.replace("/");
      } else {
        console.log("error");
        //toast({ title: "Login failed. Please try again." });
      }
    } catch (error) {
      console.log({ error });
    }
  };

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
            nativeID="name"
            onChangeText={(text) => {
              nameRef.current = text;
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
          <Text style={styles.label}>Your username</Text>
          <TextInput
            placeholder="Enter your username"
            autoCapitalize="none"
            nativeID="userName"
            onChangeText={(text) => {
              userNameRef.current = text;
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
            const user = {
              email: emailRef.current,
              name: nameRef.current,
              password: passwordRef.current,
              username: userNameRef.current,
            };
            await handleSignup(user);
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
