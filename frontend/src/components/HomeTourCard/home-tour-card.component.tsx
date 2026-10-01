import { Link } from "react-router-dom";
import type { Tour } from "../../features/tours/toursApiSlice";

const HomeTourCard = ({ tour }: { tour: Tour }) => (
  <li className="h-[26rem] sm:h-[28rem]">
    <Link
      to={`/tour/${tour.slug}`}
      className="group relative isolate flex h-full flex-col justify-between overflow-hidden p-8 text-white"
    >
      <img
        src={`/img/tours/${tour.imageCover}`}
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-gray-950/25 via-transparent to-gray-950/50" />
      <div className="absolute inset-0 -z-10 bg-[#2f5783]/80 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="w-fit border border-white/80 px-3 py-1.5 text-center leading-tight">
        <div className="text-[0.6rem] tracking-widest uppercase">From</div>
        <div className="text-xl font-light">${tour.price}</div>
        <div className="text-[0.6rem] tracking-widest uppercase">
          per person
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-[0.25em] text-white/85 uppercase">
          {tour.duration} days from {tour.startLocation.description}
        </p>
        <h3 className="mt-2 text-3xl font-light">{tour.name}</h3>
        <p className="mt-4 max-h-0 overflow-hidden text-sm leading-relaxed text-white/90 transition-all duration-500 group-hover:max-h-32">
          {tour.summary}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 border-b border-white/70 pb-1 text-xs font-semibold tracking-widest uppercase">
          View tour
          <svg className="size-4 fill-current">
            <use href="/img/icons.svg#icon-arrow-right" />
          </svg>
        </span>
      </div>
    </Link>
  </li>
);

export default HomeTourCard;
