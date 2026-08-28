"use client";

import React from "react";
import Image from "next/image";

export interface AuthorItem {
  id: string;
  name: string;
  role: string;
  imageSrc: string;
  imageAlt?: string;
}

export interface AuthorsOfAkamProps {
  title?: string;
  subtitle?: string;
  authors?: AuthorItem[];
}

const defaultAuthors: AuthorItem[] = [
  {
    id: "1",
    name: "M. T. Vasudevan Nair",
    role: "Jnanpith laureate, novelist, and screenwriter.",
    imageSrc: "/images/authors/mt.jpg",
  },
  {
    id: "2",
    name: "T. Padmanabhan",
    role: "Iconic master of Malayalam short stories.",
    imageSrc: "/images/authors/padmanabhan.jpg",
  },
  {
    id: "3",
    name: "M. Mukundan",
    role: "Key figure in modern Malayalam fiction.",
    imageSrc: "/images/authors/mukundan.jpg",
  },
  {
    id: "4",
    name: "M. T. Vasudevan Nair",
    role: "Jnanpith laureate, novelist, and screenwriter.",
    imageSrc: "/images/authors/mt.jpg",
  },
  {
    id: "5",
    name: "M. Mukundan",
    role: "Key figure in modern Malayalam fiction.",
    imageSrc: "/images/authors/mukundan.jpg",
  },
  {
    id: "6",
    name: "M. T. Vasudevan Nair",
    role: "Jnanpith laureate, novelist, and screenwriter.",
    imageSrc: "/images/authors/mt.jpg",
  },
  {
    id: "7",
    name: "M. T. Vasudevan Nair",
    role: "Jnanpith laureate, novelist, and screenwriter.",
    imageSrc: "/images/authors/mt.jpg",
  },
  {
    id: "8",
    name: "T. Padmanabhan",
    role: "Iconic master of Malayalam short stories.",
    imageSrc: "/images/authors/padmanabhan.jpg",
  },
];

export const AuthorsOfAkam: React.FC<AuthorsOfAkamProps> = ({
  title = "Authors Of Akam",
  subtitle = "The voices, minds, and storytellers behind our archives.",
  authors = defaultAuthors,
}) => {
  return (
    <section className="relative w-full bg-white py-16 sm:py-20 lg:py-28 font-poppins overflow-hidden">
      <div className="container px-4 mx-auto relative z-10">

        {/* Section Header */}
        <div className="text-center mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-dark-text tracking-tight mb-3 font-poppins">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-[#5A6560C2] font-normal leading-relaxed font-poppins">
            {subtitle}
          </p>
        </div>

        {/* Authors Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mx-auto">
          {authors.map((author, index) => (
            <div
              key={`${author.id}-${index}`}
              className="flex flex-col items-center text-center group cursor-pointer"
            >
              {/* Circular Avatar */}
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden mb-5 bg-gray-100 shadow-xs border-2 border-transparent group-hover:border-gray-200 transition-all">
                <Image
                  src={author.imageSrc}
                  alt={author.imageAlt || author.name}
                  fill
                  sizes="(max-width: 640px) 150px, 180px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Name */}
              <h3 className="text-lg sm:text-xl font-bold text-dark-text tracking-tight mb-1.5 font-poppins group-hover:text-black transition-colors">
                {author.name}
              </h3>

              {/* Role / Description */}
              <p className="text-sm text-[#5A6560C2] font-normal leading-relaxed mx-auto font-poppins">
                {author.role}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default AuthorsOfAkam;
