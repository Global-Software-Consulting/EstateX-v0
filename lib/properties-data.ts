export type Property = {
  id: string
  title: string
  city: string
  state: string
  price: number
  priceUnit?: "month" | null
  beds: number
  baths: number
  sqft: number
  type: "House" | "Apartment" | "Villa" | "Townhouse" | "Loft" | "Cabin"
  listing: "buy" | "rent"
  image: string
}

export const properties: Property[] = [
  {
    id: "1",
    title: "Glasshouse Residence",
    city: "Los Angeles",
    state: "CA",
    price: 4250000,
    priceUnit: null,
    beds: 5,
    baths: 4,
    sqft: 4800,
    type: "House",
    listing: "buy",
    image: "/properties/listing-1.png",
  },
  {
    id: "2",
    title: "Skyline Penthouse",
    city: "New York",
    state: "NY",
    price: 12500,
    priceUnit: "month",
    beds: 3,
    baths: 3,
    sqft: 2600,
    type: "Apartment",
    listing: "rent",
    image: "/properties/listing-2.png",
  },
  {
    id: "3",
    title: "Irongate Townhouse",
    city: "Chicago",
    state: "IL",
    price: 1850000,
    priceUnit: null,
    beds: 4,
    baths: 3,
    sqft: 3200,
    type: "Townhouse",
    listing: "buy",
    image: "/properties/listing-3.png",
  },
  {
    id: "4",
    title: "Oceanview Villa",
    city: "Miami",
    state: "FL",
    price: 6900000,
    priceUnit: null,
    beds: 6,
    baths: 5,
    sqft: 6100,
    type: "Villa",
    listing: "buy",
    image: "/properties/listing-4.png",
  },
  {
    id: "5",
    title: "Pinecrest Cabin",
    city: "Austin",
    state: "TX",
    price: 8200,
    priceUnit: "month",
    beds: 3,
    baths: 2,
    sqft: 2100,
    type: "Cabin",
    listing: "rent",
    image: "/properties/listing-5.png",
  },
  {
    id: "6",
    title: "Foundry Loft",
    city: "San Francisco",
    state: "CA",
    price: 2350000,
    priceUnit: null,
    beds: 2,
    baths: 2,
    sqft: 1900,
    type: "Loft",
    listing: "buy",
    image: "/properties/listing-6.png",
  },
]

export type City = {
  name: string
  state: string
  listings: number
  image: string
}

export const cities: City[] = [
  { name: "Karachi", state: "Sindh", listings: 842, image: "/cities/new-york.png" },
  { name: "Lahore", state: "Punjab", listings: 618, image: "/cities/los-angeles.png" },
  { name: "Islamabad", state: "ICT", listings: 494, image: "/cities/miami.png" },
  { name: "Rawalpindi", state: "Punjab", listings: 271, image: "/cities/chicago.png" },
  { name: "Peshawar", state: "KPK", listings: 153, image: "/cities/san-francisco.png" },
  { name: "Multan", state: "Punjab", listings: 128, image: "/cities/austin.png" },
]

export const propertyTypes = ["House", "Apartment", "Villa", "Townhouse", "Loft", "Cabin"] as const
