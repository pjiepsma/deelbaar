/*
<ProfilePhotoBottomSheet ref={bottomSheetRef} setAvatar={setAvatar} />
      <View style={styles.centered}>
        <View>
          <Image source={avatar || ImageAssets.avatar} style={styles.avatar} />

          <TouchableOpacity
            style={styles.round}
            onPress={handlePresentModalPress}
          >
            <Ionicons style={styles.edit} name="pencil-outline" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <View>

        <View>
          <TouchableOpacity
            style={defaultStyles.roundedButton}
            onPress={() => router.push("/(modals)/sign-up")}
          >
            <Text>Sign up</Text>
          </TouchableOpacity>
        </View>
        <View style={defaultStyles.row}>
          <Text>Already a member?</Text>
          <Link href={"/(modals)/sign-in"}>
            <Text style={defaultStyles.link}>Log in</Text>
          </Link>
        </View>
      </View>

      <Link href={`/(modals)/create`} asChild>
        <TouchableOpacity>
          <Text>Create new Point (need account) </Text>
        </TouchableOpacity>
      </Link>
      {user && (
        <View style={styles.card}>
          {creator ? (
            <View>
              {creator.listings.map((listing: Models.Document) => (
                <Text>{JSON.stringify(listing)}</Text>
              ))}
            </View>
          ) : (
            <View></View>
          )}

          <View style={{ flexDirection: "row", gap: 6 }}>
            {!edit && (
              <View style={styles.editRow}>
                <Text style={{ fontFamily: "mon-b", fontSize: 22 }}>
                  {firstName}
                </Text>
                <TouchableOpacity onPress={() => setEdit(true)}>
                  <Ionicons
                    name="create-outline"
                    size={24}
                    color={Colors.dark}
                  />
                </TouchableOpacity>
              </View>
            )}
            {edit && (
              <View style={styles.editRow}>
                <TextInput
                  placeholder="First Name"
                  value={firstName || ""}
                  onChangeText={setFirstName}
                  style={[defaultStyles.inputField, { width: 100 }]}
                />
                <TouchableOpacity onPress={handleUpdate}>
                  <Ionicons
                    name="checkqmark-outline"
                    size={24}
                    color={Colors.dark}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      )}
      <View>
        <Image source={ImageAssets.pointBook} style={styles.character} />
      </View>
 */