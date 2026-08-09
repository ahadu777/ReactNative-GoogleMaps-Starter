export type Location = {
  latitude: number;
  longitude: number;
};

export type DriverStatus = 'idle' | 'assigned';

export type Driver = {
  id: string;
  name: string;
  location: Location;
  status: DriverStatus;
};

export type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
};

export type RouteInfo = {
  coordinates: Location[];
  distance: string;
  duration: string;
};
