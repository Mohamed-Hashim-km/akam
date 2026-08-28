"use client";

import React from "react";
import Image from "next/image";

export interface ArtistItem {
  id: string;
  name: string;
  bio: string;
  imageSrc: string;
  imageAlt?: string;
}

export interface FeaturedArtistProps {
  title?: string;
  artists?: ArtistItem[];
}

const defaultArtists: ArtistItem[] = [
  {
    id: "1",
    name: "M. T. Vasudevan Nair",
    bio: "Jnanpith laureate, novelist, and screenwriter.",
    imageSrc: "/images/artists/mt-vasudevan-nair.jpg",
    imageAlt: "M. T. Vasudevan Nair",
  },
  {
    id: "2",
    name: "T. Padmanabhan",
    bio: "Iconic master of Malayalam short stories",
    imageSrc: "/images/artists/t-padmanabhan.jpg",
    imageAlt: "T. Padmanabhan",
  },
  {
    id: "3",
    name: "M. Mukundan",
    bio: "Key figure in modern Malayalam fiction.",
    imageSrc: "/images/artists/m-mukundan.jpg",
    imageAlt: "M. Mukundan",
  },
  {
    id: "4",
    name: "M. T. Vasudevan Nair",
    bio: "Jnanpith laureate, novelist, and screenwriter.",
    imageSrc: "/images/artists/mt-vasudevan-nair-2.jpg",
    imageAlt: "M. T. Vasudevan Nair",
  },
];

export const FeaturedArtist: React.FC<FeaturedArtistProps> = ({
  title = "Featured Artist",
  artists = defaultArtists,
}) => {
  return (
    <section className="relative w-full bg-white py-16 lg:py-24 font-poppins overflow-hidden">
     
      <div className="container px-4 mx-auto">
        {/* Section Heading matching site-wide section header typography */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-10 lg:mb-14 text-left">
          {title}
        </h2>

        {/* Artists Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 items-start justify-items-center">
          {artists.map((artist) => (
            <div key={artist.id} className="flex flex-col items-center text-center group cursor-pointer">
              {/* Circle Image Avatar Container */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-full overflow-hidden shadow-sm border border-gray-100 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                <Image
                  src={artist.imageSrc}
                  alt={artist.imageAlt || artist.name}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Name matching card titles */}
              <h3 className="text-lg sm:text-xl font-semibold text-dark-bg tracking-tight mt-5 group-hover:text-black transition-colors">
                {artist.name}
              </h3>

              {/* Bio Subtitle matching secondary text typography */}
              <p className="text-xs sm:text-sm text-dark-bg/70 font-normal mt-1.5 max-w-[220px] leading-relaxed">
                {artist.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtist;
