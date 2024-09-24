// import { Ionicons } from '@expo/vector-icons';
// import * as Location from 'expo-location';
// import { useRouter } from 'expo-router';
// import { debounce } from 'lodash';
// import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
// import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
// import MapView from 'react-native-map-clustering';
// import { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import { Region } from 'react-native-maps/lib/sharedTypes';
//
// import Colors from '~/constants/Colors';
// import { defaultStyles } from '~/constants/Styles';
// import { useAuth } from '~/lib/AuthProvider';
// import { ListingRecord } from '~/lib/powersync/AppSchema';
// import { AsyncStorageConnector } from '~/lib/powersync/AsyncStorageConnector'; // Import your AsyncStorage connector
// import { useSystem } from '~/lib/powersync/PowerSync';
//
// interface Props {
//     setListings: (state: ListingRecord[]) => void;
//     setListing: (state: ListingRecord) => void;
//     listings: ListingRecord[];
//     category: string;
// }
//
// interface MapRegion {
//     latitude: number;
//     longitude: number;
//     latitudeDelta: number;
//     longitudeDelta: number;
// }
//
// const ListingsMap = memo(({ category, listings, setListings, setListing }: Props) => {
//     const router = useRouter();
//     const mapRef = useRef<any>(null);
//     const { user } = useAuth();
//     const [region, setRegion] = useState<MapRegion>();
//     const [loading, setLoading] = useState<boolean>(false);
//     const { connector } = useSystem();
//
//     const getListingsInView = async (
//         lat: number,
//         long: number,
//         min_lat: number,
//         min_long: number,
//         max_lat: number,
//         max_long: number
//     ) => {
//         const { data } = await connector.client.rpc('listings_in_view', {
//             lat,
//             long,
//             min_lat,
//             min_long,
//             max_lat,
//             max_long,
//         });
//         return data;
//     };
//
//     const cacheListings = async (key: string, listings: ListingRecord[]) => {
//         await AsyncStorageConnector.setItem(key, JSON.stringify(listings));
//     };
//
//     const getCachedListings = async (key: string) => {
//         const cachedData = await AsyncStorageConnector.getItem(key);
//         return cachedData ? JSON.parse(cachedData) : null;
//     };
//
//     const calculateBounds = (
//         latitude: number,
//         longitude: number,
//         latitudeDelta: number,
//         longitudeDelta: number
//     ) => {
//         return {
//             minLat: latitude - latitudeDelta / 2,
//             maxLat: latitude + latitudeDelta / 2,
//             minLong: longitude - longitudeDelta / 2,
//             maxLong: longitude + longitudeDelta / 2,
//         };
//     };
//
//     useEffect(() => {
//         onLocateMe();
//     }, []);
//
//     const onLocateMe = async () => {
//         const { status } = await Location.requestForegroundPermissionsAsync();
//         if (status !== 'granted') {
//             return;
//         }
//
//         const location = await Location.getCurrentPositionAsync({});
//         const latitude = location.coords.latitude;
//         const longitude = location.coords.longitude;
//
//         // Set the region to the user's location
//         const newRegion = {
//             latitude,
//             longitude,
//             latitudeDelta: 0.05,
//             longitudeDelta: 0.05,
//         };
//         setRegion(newRegion);
//
//         // Check the cache before fetching listings
//         const cachedListings = await getCachedListings(`listings_${latitude}_${longitude}`);
//         if (cachedListings) {
//             setListings(cachedListings);
//         } else {
//             await fetchListings(newRegion);
//         }
//     };
//
//     const fetchListings = async (region: MapRegion) => {
//         setLoading(true);
//         const { minLat, maxLat, minLong, maxLong } = calculateBounds(
//             region.latitude,
//             region.longitude,
//             region.latitudeDelta,
//             region.longitudeDelta
//         );
//
//         const { coords } = await Location.getCurrentPositionAsync({});
//         const stores = await getListingsInView(
//             coords.latitude,
//             coords.longitude,
//             minLat,
//             minLong,
//             maxLat,
//             maxLong
//         );
//
//         setListings(stores);
//         await cacheListings(`listings_${coords.latitude}_${coords.longitude}`, stores);
//         setLoading(false);
//     };
//
//     const handleRegionChangeComplete = async (region: Region) => {
//         if (!region) return;
//
//         const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
//
//         // // Fetch listings only if region has changed significantly
//         // if (Math.abs(latitudeDelta) < 0.01 && Math.abs(longitudeDelta) < 0.01) {
//         //   return;
//         // }
//
//         // Check the cache before fetching listings
//         const cachedListings = await getCachedListings(`listings_${latitude}_${longitude}`);
//         if (cachedListings) {
//             setListings(cachedListings);
//         } else {
//             await fetchListings({ latitude, longitude, latitudeDelta, longitudeDelta });
//         }
//     };
//
//     const debounceRegionChangeComplete = useCallback(debounce(handleRegionChangeComplete, 1000), []);
//
//     const handleMarkerPress = (listing: ListingRecord) => {
//         setListing(listing);
//     };
//
//     const renderMarker = useCallback(
//         (store) => (
//             <Marker
//                 key={store.id}
//                 coordinate={{ latitude: store.lat, longitude: store.long }}
//                 onPress={() => handleMarkerPress(store)}
//                 tracksViewChanges={false} // Prevents frequent re-renders
//             >
//                 <View style={styles.marker}>
//                     <Ionicons name="library-outline" size={20} color={Colors.light} />
//                 </View>
//             </Marker>
//         ),
//         []
//     );
//
//     return (
//         <View style={defaultStyles.container}>
//             {loading && (
//                 <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingIndicator} />
//             )}
//             {region && (
//                 <MapView
//                     minZoomLevel={12}
//                     ref={mapRef}
//                     animationEnabled={false}
//                     style={StyleSheet.absoluteFillObject}
//                     onRegionChangeComplete={debounceRegionChangeComplete}
//                     initialRegion={region}
//                     clusterColor="#fff"
//                     clusterTextColor="#000"
//                     clusterFontFamily="mon-sb"
//                     radius={40}
//                     provider={PROVIDER_GOOGLE}
//                     showsUserLocation
//                     showsMyLocationButton>
//                     {listings.map(renderMarker)}
//                 </MapView>
//             )}
//             <TouchableOpacity style={styles.locateBtn} onPress={onLocateMe}>
//                 <Ionicons name="navigate" size={24} color={Colors.dark} />
//             </TouchableOpacity>
//         </View>
//     );
// });
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//     },
//     marker: {
//         flexDirection: 'row',
//         padding: 4,
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: Colors.primary,
//         elevation: 5,
//         borderRadius: 8,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowRadius: 6,
//         shadowOffset: {
//             width: 1,
//             height: 10,
//         },
//     },
//     locateBtn: {
//         position: 'absolute',
//         top: 70,
//         right: 20,
//         backgroundColor: '#fff',
//         padding: 10,
//         borderRadius: 10,
//         elevation: 2,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowRadius: 6,
//         shadowOffset: {
//             width: 1,
//             height: 10,
//         },
//     },
//     loadingIndicator: {
//         position: 'absolute',
//         top: '50%',
//         left: '50%',
//         marginLeft: -15,
//         marginTop: -15,
//         zIndex: 1000,
//     },
// });
//
// export default ListingsMap;
