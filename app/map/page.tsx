"use client";

import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { useState, useCallback, useRef } from "react";
import { Drawer, Input, Space } from "antd";
import axios, { AxiosError } from "axios"; // Import AxiosError type

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: -6.2088,
  lng: 106.8456,
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const AIR_QUALITY_API_KEY = process.env.NEXT_PUBLIC_AIR_QUALITY_API_KEY || ""; // Pastikan Anda punya API key untuk Air Quality

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables."
  );
}

if (!AIR_QUALITY_API_KEY) {
  console.warn(
    "Google Air Quality API key is missing. You won't be able to fetch air quality data."
  );
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface LocationDetails {
  formatted_address: string;
  address_components: AddressComponent[];
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface AirQualityData {
  indexes?: {
    displayName: string;
    aqi: number;
    category: string;
  }[];
  pollutants?: {
    displayName: string;
    concentration: {
      value: number;
      units: string;
    };
  }[];
  healthRecommendations?: string[];
}

const fetchAirQuality = async (
  latitude: number,
  longitude: number,
  apiKey: string
): Promise<AirQualityData | null> => {
  if (!apiKey) return null;
  try {
    const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`; // Perhatikan, key sekarang menjadi parameter kueri
    const requestBody = {
      location: {
        latitude: latitude,
        longitude: longitude,
      },
      universalAqi: true, // Contoh parameter lain
      // Anda dapat menambahkan parameter lain sesuai kebutuhan dokumentasi
    };
    const response = await axios.post(url, requestBody);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error(
      "Error fetching air quality data:",
      axiosError.response?.data || axiosError.message
    );
    return null;
  }
};

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] =
    useState<google.maps.LatLng | null>(null);
  const [locationDetails, setLocationDetails] =
    useState<LocationDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(
    null
  ); // State untuk data kualitas udara

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setSelectedLocation(event.latLng);
      setAirQualityData(null); // Reset data kualitas udara saat lokasi baru dipilih

      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat: lat, lng: lng },
        });

        if (response.results[0]) {
          setLocationDetails(response.results[0] as LocationDetails);
          setIsDrawerOpen(true);
        }

        // Fetch air quality data
        const airQuality = await fetchAirQuality(lat, lng, AIR_QUALITY_API_KEY);
        setAirQualityData(airQuality);
      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    },
    [AIR_QUALITY_API_KEY]
  );

  const onLoad = useCallback(
    (autocomplete: google.maps.places.Autocomplete) => {
      autocompleteRef.current = autocomplete;
    },
    []
  );

  const onPlaceChanged = useCallback(async () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedLocation(new google.maps.LatLng(lat, lng));
        setLocationDetails(place as LocationDetails);
        setIsDrawerOpen(true);
        setAirQualityData(null); // Reset data kualitas udara saat lokasi baru dipilih

        // Fetch air quality data
        const airQuality = await fetchAirQuality(lat, lng, AIR_QUALITY_API_KEY);
        setAirQualityData(airQuality);
      }
    }
  }, [AIR_QUALITY_API_KEY]);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setAirQualityData(null); // Clear air quality data when drawer is closed
  };

  const getAddressComponents = (details: LocationDetails | null) => {
    if (!details) return {};

    const components: Record<string, string> = {};
    if (details.address_components) {
      details.address_components.forEach((component) => {
        const type = component.types[0];
        components[type] = component.long_name;
      });
    }
    return components;
  };

  const addressComponents = getAddressComponents(locationDetails);

  return (
    <div className="w-full h-screen relative">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={12}
          onClick={handleMapClick}
        >
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <Input
              type="text"
              placeholder="Search for a location"
              style={{
                boxSizing: `border-box`,
                border: `1px solid transparent`,
                width: `240px`,
                height: `32px`,
                padding: `0 12px`,
                borderRadius: `3px`,
                boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                fontSize: `14px`,
                outline: `none`,
                textOverflow: `ellipses`,
                position: "absolute",
                left: "50%",
                marginLeft: "-120px",
                top: "10px",
              }}
            />
          </Autocomplete>

          {selectedLocation && (
            <Marker
              position={selectedLocation}
              title={locationDetails?.formatted_address}
            />
          )}
        </GoogleMap>
      </LoadScript>

      <Drawer
        title="Location Details"
        placement="right"
        onClose={handleDrawerClose}
        open={isDrawerOpen}
        width={400}
      >
        {locationDetails && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <strong>Address:</strong> {locationDetails.formatted_address}
            </div>
            {addressComponents.street_number && (
              <div>
                <strong>Street:</strong> {addressComponents.street_number}{" "}
                {addressComponents.route}
              </div>
            )}
            {addressComponents.locality && (
              <div>
                <strong>City:</strong> {addressComponents.locality}
              </div>
            )}
            {addressComponents.administrative_area_level_1 && (
              <div>
                <strong>Province:</strong>{" "}
                {addressComponents.administrative_area_level_1}
              </div>
            )}
            {addressComponents.country && (
              <div>
                <strong>Country:</strong> {addressComponents.country}
              </div>
            )}
            <div>
              <strong>Coordinates:</strong> {selectedLocation?.lat().toFixed(6)}
              , {selectedLocation?.lng().toFixed(6)}
            </div>

            {/* Tampilkan data kualitas udara jika tersedia */}
            {airQualityData && (
              <div style={{ marginTop: 20 }}>
                <h3>Air Quality</h3>
                {airQualityData.indexes && airQualityData.indexes.length > 0 ? (
                  <div>
                    <strong>AQI:</strong> {airQualityData.indexes[0].aqi} (
                    {airQualityData.indexes[0].category}) -{" "}
                    {airQualityData.indexes[0].displayName}
                  </div>
                ) : (
                  <div>No AQI data available.</div>
                )}
                {airQualityData.indexes && airQualityData.indexes.length > 0 ? (
                  <div>
                    <strong>Dominant Polutant:</strong>{" "}
                    {airQualityData.indexes[0].dominantPollutant}
                  </div>
                ) : (
                  <div>No AQI data available.</div>
                )}
                {airQualityData.pollutants &&
                  airQualityData.pollutants.length > 0 && (
                    <div>
                      <strong>Pollutants:</strong>
                      <ul>
                        {airQualityData.pollutants.map((pollutant) => (
                          <li key={pollutant.displayName}>
                            {pollutant.displayName}:{" "}
                            {pollutant.concentration.value}{" "}
                            {pollutant.concentration.units}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {airQualityData.healthRecommendations &&
                  airQualityData.healthRecommendations.length > 0 && (
                    <div>
                      <strong>Health Recommendations:</strong>
                      <ul>
                        {airQualityData.healthRecommendations.map(
                          (recommendation, index) => (
                            <li key={index}>{recommendation}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
            {!airQualityData &&
              isDrawerOpen &&
              selectedLocation &&
              AIR_QUALITY_API_KEY && <div>Fetching air quality data...</div>}
            {!AIR_QUALITY_API_KEY && isDrawerOpen && (
              <div style={{ color: "orange" }}>
                Air Quality API key not provided.
              </div>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
}
