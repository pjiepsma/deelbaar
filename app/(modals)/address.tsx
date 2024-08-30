// import { StyleSheet, Text, TextInput, View } from "react-native";
// import React from "react";
//
// const Booking = () => {
//   return (
//     <View style={{ flex: 1 }}>
//       {/* Header */}
//       <Appbar.Header>
//         <Appbar.BackAction onPress={() => {}} />
//         <TextInput
//           placeholder="Place or Address"
//           style={{ flex: 1, marginLeft: 8 }}
//         />
//         <Icon name="close" size={24} style={{ marginLeft: 8 }} />
//       </Appbar.Header>
//
//       {/* Action Buttons */}
//       <ScrollView horizontal contentContainerStyle={{ padding: 16 }}>
//         <Button
//           icon={() => <Icon name="crosshairs-gps" size={24} />}
//           mode="contained"
//           style={{ marginHorizontal: 8 }}
//         >
//           Use Current Location
//         </Button>
//         <Button
//           icon={() => <Icon name="map-outline" size={24} />}
//           mode="contained"
//           style={{ marginHorizontal: 8 }}
//         >
//           Choose On Map
//         </Button>
//         <Button
//           icon={() => <Icon name="bookmark-outline" size={24} />}
//           mode="contained"
//           style={{ marginHorizontal: 8 }}
//         >
//           Select From Saved Places
//         </Button>
//         <Button
//           icon={() => <Icon name="delete-outline" size={24} />}
//           mode="contained"
//           style={{ marginHorizontal: 8 }}
//         >
//           Delete Waypoint
//         </Button>
//       </ScrollView>
//
//       {/* Recent Searches */}
//       <View style={{ padding: 16 }}>
//         <Text style={{ fontSize: 16, fontWeight: "bold" }}>
//           Recent searches
//         </Text>
//         <List.Item
//           title="Wenumsedwarsweg 99, 7345 AS Wenum, Nederland, Wenum"
//           left={(props) => <Icon {...props} name="clock-outline" size={24} />}
//         />
//         <List.Item
//           title="Eltener Markt 4, 46446 Emmerich am Rhein, Deutschland, Emmerich am Rhein"
//           left={(props) => <Icon {...props} name="clock-outline" size={24} />}
//         />
//         <Text style={{ color: "gray", marginTop: 16 }}>
//           MORE FROM RECENT HISTORY
//         </Text>
//       </View>
//
//       {/* Show Places on Map */}
//       <View style={{ padding: 16 }}>
//         <Text style={{ fontSize: 16, fontWeight: "bold" }}>
//           SHOW PLACES ON MAP
//         </Text>
//         <List.Item
//           title="Highlights"
//           left={(props) => <Icon {...props} name="star-outline" size={24} />}
//         />
//         <List.Item
//           title="Saved Places"
//           left={(props) => (
//             <Icon {...props} name="bookmark-outline" size={24} />
//           )}
//         />
//         <List.Item
//           title="Beaches and Swimming Pools"
//           left={(props) => <Icon {...props} name="swim" size={24} />}
//         />
//         <List.Item
//           title="For the Kids"
//           left={(props) => (
//             <Icon {...props} name="baby-face-outline" size={24} />
//           )}
//         />
//         <List.Item
//           title="Natural Sights"
//           left={(props) => <Icon {...props} name="pine-tree" size={24} />}
//         />
//         <List.Item
//           title="Points of Interest"
//           left={(props) => (
//             <Icon {...props} name="home-city-outline" size={24} />
//           )}
//         />
//       </View>
//     </View>
//   );
// };
//
// export default Booking;
//
// const styles = StyleSheet.create({});
