import { Link } from "react-router-dom";
import { useGetAllToursQuery } from "../../features/tours/toursApiSlice";
import TourCard from "../../components/TourCard/tour.card.component";
import HomeTourCard from "../../components/HomeTourCard/home-tour-card.component";
import { outlineButton } from "./home.styles";

const Home = () => {
  const { data: tours } = useGetAllToursQuery();

  const featured = (tours ?? []).slice(0, 4);
  const popular = (tours ?? []).slice(0, 3);

  return (
    <main className="flex-1">
      {/* Hero - fills the whole first screen. The negative margin pulls it up
        behind the sticky nav (72px + border), which is transparent on this
        route until the page scrolls. */}
      <section className="relative isolate -mt-[73px] flex min-h-svh flex-col items-center justify-end overflow-hidden px-4 pt-40 pb-36 text-center">
        <img
          src="/img/tours/tour-1-cover.jpg"
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        {/* The photo keeps its colour. The only shade is a thin strip at the
          top for the nav; the text carries its own dark panel. */}
        <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-linear-to-b from-gray-950/40 to-transparent" />

        {/* Sits low, over the dark trees rather than the white clouds. */}
        <div className="max-w-3xl rounded-2xl bg-gray-950/50 px-6 py-8 sm:px-12 sm:py-10">
          <h1 className="font-sans text-3xl font-light tracking-wide text-white uppercase sm:text-5xl">
            Outdoors is where life happens
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            Nine tours across two continents, led by guides who have walked
            every mile of them.
          </p>

          <Link
            to="/tours"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-w_primary-600 px-7 py-3 text-sm font-semibold tracking-widest text-white uppercase outline-2 outline-offset-2 outline-w_primary-600 transition-colors hover:bg-w_primary-700 hover:outline-w_primary-700"
          >
            Discover our tours
            <svg className="size-4 fill-current">
              <use href="/img/icons.svg#icon-arrow-right" />
            </svg>
          </Link>
        </div>

        <a
          href="#featured"
          className="absolute bottom-8 flex flex-col items-center gap-2 text-[0.65rem] tracking-widest text-white uppercase text-shadow-md"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-5 justify-center rounded-full border border-white/80 pt-1.5"
          >
            <span className="h-2 w-0.5 animate-bounce rounded-full bg-white" />
          </span>
          Scroll to explore
        </a>
      </section>

      {/* Everything below the hero is capped to the site's page width. */}
      <div className="mx-auto w-full max-w-page">
        {/* Featured tours - photo tiles, no gaps. */}
        <section id="featured" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="sr-only">
            Our highest-rated tours
          </h2>
          {featured.length > 0 ? (
            <ul
              aria-label="Featured tours"
              className="grid sm:grid-cols-2 lg:grid-cols-4"
            >
              {featured.map(tour => (
                <HomeTourCard key={tour._id} tour={tour} />
              ))}
            </ul>
          ) : (
            <p className="bg-linear-to-br from-[#f7f5f1] to-[#ebe5da] px-4 py-24 text-center text-[#4a4032] dark:from-[#16263a] dark:to-gray-900 dark:text-[#cfe0ef]">
              Our next adventures are almost ready, from vineyard tastings and
              beach walks to northern lights and mountain trails.
              <br />
              Check back in a moment.
            </p>
          )}
        </section>

        {/* About band */}
        <section className="border-t-4 border-w_primary-600 bg-linear-to-br from-[#f3f7fb] to-[#e2ecf5] py-20 text-gray-900 lg:py-24 dark:border-[#6f8f3a] dark:from-gray-900 dark:via-gray-900 dark:to-[#1c3324] dark:text-white">
          <div className="px-8 sm:px-16">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.25em] text-[#1e3a5f] uppercase dark:text-[#a9c47a]">
                About us
              </p>
              <h2 className="mt-3 text-3xl font-light sm:text-4xl">
                Guides who grew up on the trail
              </h2>
              <p className="mt-6 leading-relaxed text-gray-700 dark:text-gray-300">
                Every itinerary here has been walked, paddled or climbed by the
                person who wrote it, and refined by everyone who has been since.
                The price on the card is the price you pay.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <li className="flex items-center gap-3">
                <svg className="size-5 shrink-0 fill-current text-[#1e3a5f] dark:text-[#a9c47a]">
                  <use href="/img/icons.svg#icon-check-circle" />
                </svg>
                Groups of eight to twenty-five
              </li>
              <li className="flex items-center gap-3">
                <svg className="size-5 shrink-0 fill-current text-[#1e3a5f] dark:text-[#a9c47a]">
                  <use href="/img/icons.svg#icon-check-circle" />
                </svg>
                Guides who live there
              </li>
              <li className="flex items-center gap-3">
                <svg className="size-5 shrink-0 fill-current text-[#1e3a5f] dark:text-[#a9c47a]">
                  <use href="/img/icons.svg#icon-check-circle" />
                </svg>
                Lodging and permits included
              </li>
              <li className="flex items-center gap-3">
                <svg className="size-5 shrink-0 fill-current text-[#1e3a5f] dark:text-[#a9c47a]">
                  <use href="/img/icons.svg#icon-check-circle" />
                </svg>
                On the trail since 2015
              </li>
            </ul>
          </div>
        </section>

        {/* Split: photo left, text right */}
        <section className="grid lg:grid-cols-2">
          <img
            src="/img/tours/tour-2-1.jpg"
            alt="A rowing boat under a palm tree on a white beach"
            loading="lazy"
            className="h-80 w-full object-cover lg:h-full lg:min-h-[30rem]"
          />
          <div className="flex flex-col justify-center bg-linear-to-br from-[#4a86c5] to-[#2f5783] px-8 py-16 text-white sm:px-16">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#d6e6f5] uppercase">
              Our tours
            </p>
            <h2 className="mt-3 text-3xl font-light sm:text-4xl">
              Mountains, coastlines and northern lights
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-[#eef5fb]">
              From a week on the sea to a winter under the aurora, every tour
              runs in small groups with lodging, permits and transfers already
              in the price.
            </p>
            <Link to="/tours" className={`${outlineButton} mt-10 w-fit`}>
              Browse the catalogue
            </Link>
          </div>
        </section>

        {/* Split: text left, photo right (photo first on mobile) */}
        <section className="grid lg:grid-cols-2">
          <img
            src="/img/tours/tour-3-cover.jpg"
            alt="A hiker on a sunlit snowy ridge above the Alps"
            loading="lazy"
            className="h-80 w-full object-cover lg:order-2 lg:h-full lg:min-h-[30rem]"
          />
          <div className="flex flex-col justify-center bg-linear-to-br from-white to-[#edf3ef] px-8 py-16 text-gray-900 sm:px-16 dark:from-gray-900 dark:to-emerald-950 dark:text-white">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#2f5d4a] uppercase dark:text-w_primary-400">
              Book online
            </p>
            <h2 className="mt-3 text-3xl font-light sm:text-4xl">
              Ten days. One adventure. Infinite memories.
            </h2>
            <p className="mt-6 max-w-lg leading-relaxed text-gray-700 dark:text-gray-300">
              Pick a departure, choose how many are coming and pay securely.
              Your seat is held the moment you book.
            </p>
            <Link
              to="/tours"
              className="mt-10 inline-flex w-fit items-center justify-center gap-2 border border-[#2f5d4a] px-7 py-3 text-sm font-semibold tracking-widest text-[#2f5d4a] uppercase transition-colors hover:bg-[#2f5d4a] hover:text-white dark:border-w_primary-400 dark:text-w_primary-400 dark:hover:bg-w_primary-400 dark:hover:text-gray-950"
            >
              Book your tour
            </Link>
          </div>
        </section>

        {/* Most popular tours - the listing's own cards, as on the original
        home page. */}
        <section className="px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-w_primary-600 uppercase dark:text-w_primary-400">
              Traveller favourites
            </p>
            <h2 className="mt-3 text-3xl font-light text-gray-900 sm:text-4xl dark:text-white">
              Most popular tours
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              The three our travellers rate highest, right now.
            </p>
          </div>

          {popular.length > 0 && (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map(tour => (
                <TourCard key={tour._id} tour={tour} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/tours"
              className="inline-flex items-center justify-center gap-2 bg-w_primary-600 px-7 py-3 text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-w_primary-700"
            >
              Discover all tours
              <svg className="size-4 fill-current">
                <use href="/img/icons.svg#icon-arrow-right" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
