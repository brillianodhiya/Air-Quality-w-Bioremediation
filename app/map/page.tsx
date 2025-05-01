"use client";

import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { useState, useCallback, useRef } from "react";
import { Drawer, Input, Space } from "antd";
// import { SearchOutlined } from "@ant-design/icons";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

const center = {
  lat: -6.2088,
  lng: 106.8456,
};

// Add API key check
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

if (!GOOGLE_MAPS_API_KEY) {
  console.error(
    "Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables."
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

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] =
    useState<google.maps.LatLng | null>(null);
  const [locationDetails, setLocationDetails] =
    useState<LocationDetails | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handleMapClick = useCallback(
    async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      setSelectedLocation(event.latLng);

      try {
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: { lat: event.latLng.lat(), lng: event.latLng.lng() },
        });

        if (response.results[0]) {
          setLocationDetails(response.results[0] as LocationDetails);
          setIsDrawerOpen(true);
        }
      } catch (error) {
        console.error("Error fetching location data:", error);
      }
    },
    []
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
      }
    }
  }, []);

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
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
          </Space>
        )}
      </Drawer>
    </div>
  );
}
