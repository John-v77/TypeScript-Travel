import { Link } from "react-router-dom";

/**
 * About us. The footer links here. About a screen and a half: the figures in
 * a strip, then the mission and principles beside the timeline.
 *
 * If the home page ever shows figures (travellers, tours, guides, rating),
 * keep the ones here in step with it - a visitor who sees two different
 * numbers stops believing either.
 */
const About = () => (
  <main className="flex-1 bg-white dark:bg-gray-950">
    <div className="mx-auto w-full max-w-page px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
        About us
      </h1>
      <p className="mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-400">
        We have been putting people on trails since 2015. Every itinerary on
        this site has been walked, paddled or climbed by the person who wrote
        it.
      </p>

      {/* By the numbers */}
      <dl className="mt-10 grid grid-cols-2 gap-8 rounded-2xl bg-gray-50 px-8 py-8 sm:grid-cols-4 dark:bg-gray-900">
        <div>
          <dt className="text-3xl font-bold text-w_primary-600 lg:text-4xl dark:text-w_primary-400">
            12k+
          </dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Travellers served since 2015
          </dd>
        </div>
        <div>
          <dt className="text-3xl font-bold text-w_primary-600 lg:text-4xl dark:text-w_primary-400">
            9
          </dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Tours worldwide
          </dd>
        </div>
        <div>
          <dt className="text-3xl font-bold text-w_primary-600 lg:text-4xl dark:text-w_primary-400">
            25
          </dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Expert guides
          </dd>
        </div>
        <div>
          <dt className="text-3xl font-bold text-w_primary-600 lg:text-4xl dark:text-w_primary-400">
            4.7
          </dt>
          <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Average rating
          </dd>
        </div>
      </dl>

      <div className="mt-14 grid gap-16 lg:grid-cols-2">
        <div>
          {/* Mission */}
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            Our mission
          </h2>
          <p className="mt-3 text-lg font-medium text-gray-700 dark:text-gray-300">
            To get people outdoors without getting between them and the place
            they came to see.
          </p>
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
            That sounds simple, and it costs us money. It means capping groups
            long before a coach is full, paying guides who live where they guide
            rather than the cheapest bidder, and putting the whole price on the
            card instead of discovering it at the end. We would rather run a
            smaller company that people come back to than a larger one they
            endure once.
          </p>

          {/* What we hold to */}
          <h2 className="mt-12 font-serif text-2xl font-bold text-gray-900 dark:text-white">
            What we hold to
          </h2>
          <dl className="mt-5 space-y-5">
            <div className="border-l-2 border-w_primary-600 pl-4 dark:border-w_primary-400">
              <dt className="text-base font-semibold text-gray-900 dark:text-white">
                Small groups, always
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Between eight and twenty-five people, never more. A group larger
                than that stops being a group and becomes a queue.
              </dd>
            </div>
            <div className="border-l-2 border-w_primary-600 pl-4 dark:border-w_primary-400">
              <dt className="text-base font-semibold text-gray-900 dark:text-white">
                Local guides, not tour reps
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Every tour is led by someone who grew up on the trail. They know
                which morning the light is best and which cafe is worth the
                detour.
              </dd>
            </div>
            <div className="border-l-2 border-w_primary-600 pl-4 dark:border-w_primary-400">
              <dt className="text-base font-semibold text-gray-900 dark:text-white">
                One price, no surprises
              </dt>
              <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                The price on the card is the price you pay. Lodging, permits and
                transfers are all in it, and there is nothing to settle at the
                end.
              </dd>
            </div>
          </dl>
        </div>

        <div>
          {/* How we got here */}
          <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
            How we got here
          </h2>
          <ol className="mt-5 space-y-8">
            <li className="grid grid-cols-[5rem_1fr] gap-4">
              <p className="font-serif text-2xl font-bold text-w_primary-600 dark:text-w_primary-400">
                2015
              </p>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Two guides and one trail
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Voyara started with a single Banff itinerary, run by the two
                  people who had walked it every summer since they were
                  teenagers. Eleven travellers came on the first departure.
                </p>
              </div>
            </li>
            <li className="grid grid-cols-[5rem_1fr] gap-4">
              <p className="font-serif text-2xl font-bold text-w_primary-600 dark:text-w_primary-400">
                2019
              </p>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Beyond the Rockies
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Requests for places we had never been kept arriving. Rather
                  than guess, we only added a destination once we had found a
                  guide who actually lived there - which is still the rule.
                </p>
              </div>
            </li>
            <li className="grid grid-cols-[5rem_1fr] gap-4">
              <p className="font-serif text-2xl font-bold text-w_primary-600 dark:text-w_primary-400">
                2023
              </p>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Ten thousand travellers
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  The ten thousandth guest walked the Inca Trail with us. The
                  group size had not changed: still no more than twenty-five
                  people, still nobody reading from a script.
                </p>
              </div>
            </li>
          </ol>

          <Link
            to="/tours"
            className="mt-10 inline-flex items-center gap-2 text-base font-semibold text-w_primary-600 transition-colors hover:text-w_primary-700 dark:text-w_primary-400"
          >
            Browse the catalogue
            <svg className="size-4 fill-current">
              <use href="/img/icons.svg#icon-arrow-right" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  </main>
);

export default About;
