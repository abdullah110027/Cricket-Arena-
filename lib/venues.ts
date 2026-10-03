export type VenueType = 'Indoor' | 'Outdoor';

export type Venue = {
  id: string;
  name: string;
  area: string;
  type: VenueType;
  pricePerSlot: number;
  facilities: string[];
  description: string;
  location: string;
  rating: number;
  slotsAvailable: number;
  image?: string;
};

export type VenueSlot = {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'unavailable';
  price?: number;
};

export const venueAreas = ['DHA', 'Gulberg', 'Johar Town', 'Bahria Town', 'Model Town'];

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateOptions = (daysAhead = 7) => {
  const today = new Date();
  return Array.from({ length: daysAhead }, (_, index) => {
    const date = addDays(today, index);
    return {
      value: formatDateKey(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
  });
};

const slotTimes = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'];

export const getVenueSlotsForDate = (venueId: string, date: string): VenueSlot[] => {
  const venueIndex = seedVenues.findIndex((venue) => venue.id === venueId);

  if (venueIndex === -1) {
    return [];
  }

  return slotTimes.map((time, index) => {
    const isBooked = (venueIndex + index + date.length) % 3 === 0;

    return {
      id: `${venueId}-${date}-${time}`,
      venueId,
      date,
      startTime: time,
      endTime: index === slotTimes.length - 1 ? '09:00 PM' : slotTimes[index + 1],
      status: isBooked ? 'booked' : 'available',
    };
  });
};

export const seedVenues: Venue[] = [
  {
    id: 'greenfield-indoor-arena',
    name: 'Greenfield Indoor Arena',
    area: 'DHA',
    type: 'Indoor',
    pricePerSlot: 28,
    facilities: ['Floodlights', 'Changing rooms', 'Parking', 'Net practice'],
    description: 'A premium indoor venue designed for private practice, team drills, and net sessions in a modern facility.',
    location: 'Phase 6, DHA Lahore',
    rating: 4.9,
    slotsAvailable: 12,
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'victory-turf-club',
    name: 'Victory Turf Club',
    area: 'Gulberg',
    type: 'Outdoor',
    pricePerSlot: 32,
    facilities: ['Match turf', 'Scoreboard', 'Refreshments', 'Parking'],
    description: 'A full-size outdoor ground with professional turf and a welcoming match-day atmosphere.',
    location: 'Gulberg Main Boulevard',
    rating: 4.8,
    slotsAvailable: 9,
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'city-pace-nets',
    name: 'City Pace Nets',
    area: 'Johar Town',
    type: 'Indoor',
    pricePerSlot: 26,
    facilities: ['Bowling lanes', 'Practice nets', 'Water station', 'Locker room'],
    description: 'Compact, high-energy training space for pace sessions, skill work, and private coaching.',
    location: 'Block C, Johar Town',
    rating: 4.7,
    slotsAvailable: 14,
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'bahria-cricket-complex',
    name: 'Bahria Cricket Complex',
    area: 'Bahria Town',
    type: 'Outdoor',
    pricePerSlot: 35,
    facilities: ['Tournament ground', 'Clubhouse', 'Floodlights', 'Parking'],
    description: 'A spacious outdoor cricket complex built for serious match play, weekend games, and local tournaments.',
    location: 'Bahria Town Phase 8',
    rating: 4.9,
    slotsAvailable: 10,
    image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'model-town-sports-hub',
    name: 'Model Town Sports Hub',
    area: 'Model Town',
    type: 'Indoor',
    pricePerSlot: 24,
    facilities: ['Indoor nets', 'Coaching area', 'Café', 'Changing rooms'],
    description: 'A modern sports facility with indoor training lanes and convenient access for daily practice sessions.',
    location: '2nd Floor, Model Town',
    rating: 4.6,
    slotsAvailable: 16,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'royal-pitch-lane',
    name: 'Royal Pitch Lane',
    area: 'DHA',
    type: 'Outdoor',
    pricePerSlot: 30,
    facilities: ['Ground staff', 'Equipment storage', 'Parking', 'Dugout'],
    description: 'A premium outdoor ground with a refined match setup and strong facilities for club practice and friendly matches.',
    location: 'DHA Defence Road',
    rating: 4.8,
    slotsAvailable: 11,
    image: 'https://images.unsplash.com/photo-1521417531038-92841cc90d5f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'gulberg-practice-grounds',
    name: 'Gulberg Practice Grounds',
    area: 'Gulberg',
    type: 'Indoor',
    pricePerSlot: 27,
    facilities: ['Practice nets', 'Coaching help', 'Parking', 'Water'],
    description: 'A compact, player-friendly training venue built for repeated practice, fielding drills, and batting work.',
    location: 'Main Gulberg Road',
    rating: 4.7,
    slotsAvailable: 13,
    image: 'https://images.unsplash.com/photo-1593111773458-7a3ae940f4a7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'johar-match-park',
    name: 'Johar Match Park',
    area: 'Johar Town',
    type: 'Outdoor',
    pricePerSlot: 29,
    facilities: ['Large playing field', 'Gazebo', 'Parking', 'Boundary lights'],
    description: 'A lively neighborhood cricket ground suited for casual leagues, team sessions, and weekend matches.',
    location: 'Johar Town East Side',
    rating: 4.5,
    slotsAvailable: 8,
    image: 'https://images.unsplash.com/photo-1562771382-3e60f16f79a6?auto=format&fit=crop&w=1200&q=80',
  },
];
