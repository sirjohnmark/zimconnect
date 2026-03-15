import { notFound } from "next/navigation";
import Image from "next/image";
import { MapPin, CalendarDays, ShieldCheck } from "lucide-react";
import { getProfileByUsername } from "@/lib/queries/profiles";
import { getListingsByUser } from "@/lib/queries/listings";
import type { PageProps } from "@/types";

export default async function ProfilePage({ params }: PageProps<{ username: string }>) {
  const { username } = await params;

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const listings = await getListingsByUser(profile.id, "active");

  const joinedYear = new Date(profile.created_at).getFullYear();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Profile header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold select-none">
                {profile.display_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {profile.display_name}
              </h1>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">@{profile.username}</p>

            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="w-4 h-4" />
                Member since {joinedYear}
              </span>
            </div>

            {profile.bio && (
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
            )}
          </div>

          {/* Stats chip */}
          <div className="shrink-0 text-center bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{profile.listings_count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Listings</p>
          </div>
        </div>

        {/* Active listings */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Active listings
            {listings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({listings.length})
              </span>
            )}
          </h2>

          {listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <p className="text-gray-500 text-sm">No active listings yet.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <a
                    href={`/listing/${listing.slug}`}
                    className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-green-300 hover:shadow-sm transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {listing.images[0] ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-3xl">
                          📷
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                        {listing.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        {listing.price !== null ? (
                          <span className="text-sm font-semibold text-green-700">
                            ${listing.price.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Contact for price</span>
                        )}
                        {listing.location && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
