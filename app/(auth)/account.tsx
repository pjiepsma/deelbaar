import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Session } from "@supabase/supabase-js";
import Avatar from "~/components/widget/AvatarWidget";
import { useAuth } from "~/lib/AuthProvider";
import { useSystem } from "~/lib/powersync/System";
import BirthdateInput from "~/components/BirthDateInput";

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [birthdate, setBirthdate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState("I'd prefer not to say");
  const [avatarUrl, setAvatarUrl] = useState("");
  const { connector } = useSystem();
  const { signOut } = useAuth();
  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await connector.client
        .from("profiles")
        .select(`name, birthdate, gender, avatar_url`)
        .eq("id", session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setName(data.name);
        setBirthdate(new Date(data.birthdate));
        setGender(data.gender);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    name,
    birthdate,
    gender,
    avatar_url,
  }: {
    name: string;
    birthdate: Date;
    gender: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        name,
        birthdate: birthdate.toISOString(),
        gender,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await connector.client.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Avatar
          size={200}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url);
            updateProfile({ name, birthdate, gender, avatar_url: url });
          }}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          value={name}
          onChangeText={(text) => setName(text)}
          placeholder="Name"
          style={styles.inputField}
        />
      </View>
      <BirthdateInput birthdate={birthdate} setBirthdate={setBirthdate} />
      {/*<DateTimePicker mode="single" date={date} onChange={(params) => setDate(params.date)} />*/}
      <View style={styles.verticallySpaced}>
        <TextInput value={email} editable={false} style={styles.inputField} />
      </View>
      {/*<View style={styles.verticallySpaced}>*/}
      {/*  <Picker*/}
      {/*    selectedValue={gender}*/}
      {/*    onValueChange={(itemValue) => setGender(itemValue)}*/}
      {/*    style={styles.picker}>*/}
      {/*    <Picker.Item label="I'd prefer not to say" value="I'd prefer not to say" />*/}
      {/*    <Picker.Item label="Female" value="Female" />*/}
      {/*    <Picker.Item label="Male" value="Male" />*/}
      {/*    <Picker.Item label="Not listed" value="Not listed" />*/}
      {/*  </Picker>*/}
      {/*</View>*/}
      <View style={styles.verticallySpaced}>
        <TouchableOpacity
          disabled={loading}
          onPress={() => signOut()}
          style={styles.link}
        >
          <Text style={styles.linkText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  verticallySpaced: {
    marginVertical: 10,
  },
  inputField: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  datePicker: {
    height: 40,
    justifyContent: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  datePickerText: {
    color: "#000",
  },
  picker: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  link: {
    alignItems: "center",
  },
  linkText: {
    color: "#007BFF",
    textDecorationLine: "underline",
  },
});
