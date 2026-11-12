/** Public comment totals shown on rail + panel header (panel shows a curated slice). */
export const FEED_COMMENT_DISPLAY_COUNT: Record<string, number> = {
  // 上千条
  "feed-1": 3_247,
  "feed-4": 2_184,
  "feed-5": 1_847,
  "feed-3": 1_423,
  "feed-19": 1_092,
  // 上百条
  "feed-11": 542,
  "feed-20": 387,
  "feed-16": 264,
  "feed-6": 198,
  "feed-2": 156,
  // 少一点
  "feed-7": 47,
  "feed-9": 31,
  "feed-12": 24,
  "feed-8": 14,
  "feed-10": 9,
  "feed-13": 7,
  "feed-14": 5,
  "feed-15": 4,
  "feed-17": 3,
  "feed-18": 2,
};

export type FeedCommentVolumeTier = "viral" | "popular" | "niche";

export function feedCommentVolumeTier(
  displayCount: number,
): FeedCommentVolumeTier {
  if (displayCount >= 1_000) return "viral";
  if (displayCount >= 100) return "popular";
  return "niche";
}

type ExtraComment = {
  authorName: string;
  content: string;
};

/** Curated extras appended to the scrollable panel sample (not the full public total). */
export const FEED_COMMENT_EXTRA_SAMPLE: Record<string, ExtraComment[]> = {
  "feed-1": [
    { authorName: "espresso_ally", content: "Ok but which one has the best oat milk options asking for a friend" },
    { authorName: "subway_sipper", content: "Adding Devocion to my weekend route immediately" },
    { authorName: "latte_lineup", content: "The La Cabra line discourse in these replies is so real" },
    { authorName: "brooklyn_bean", content: "Abraco olive oil cake mention alone sold me" },
    { authorName: "pour_over_pat", content: "SEY pour over changed my home routine ngl" },
    { authorName: "hidden_staircase", content: "Why do the best shops always have the weirdest entrances" },
    { authorName: "map_pin_maven", content: "Someone pin the exact cross streets for tourists pls" },
    { authorName: "cold_brew_carl", content: "Summer list vs winter list — this thread has both" },
    { authorName: "mug_collection", content: "Yellow mug spot is now on my photo walk list" },
    { authorName: "third_wave_tom", content: "Finally a coffee thread that is not just Starbucks slander" },
    { authorName: "weekend_walker", content: "Doing all five in one day is ambitious but I respect it" },
    { authorName: "sugar_packet", content: "Cardamom bun warning appreciated — I have no self control" },
  ],
  "feed-3": [
    { authorName: "ice_asmr", content: "The blade sound on clear ice is better than any podcast" },
    { authorName: "frozen_toes", content: "I would last 30 seconds before sitting on the shore" },
    { authorName: "lake_local", content: "We skate this bay every January when the rangers green-light it" },
    { authorName: "sunset_blades", content: "Golden hour + glass ice is an unfair combo" },
    { authorName: "crack_watch", content: "My anxiety watching the cracks but the glide is mesmerizing" },
    { authorName: "mittens_off", content: "Hands cold, views warm — classic winter trade" },
    { authorName: "drone_dream", content: "This needs an overhead shot next time" },
    { authorName: "skate_history", content: "Clear black ice only hits a few days a year this is rare" },
    { authorName: "hot_cocoa_after", content: "The post-skate cocoa ritual is half the experience" },
    { authorName: "caution_hero", content: "Thank you for the thickness check comment thread seriously" },
    { authorName: "winter_arc", content: "Saving for when my city actually gets cold enough" },
    { authorName: "echo_blades", content: "You can hear the lake through the ice at 0:14" },
    { authorName: "figure_eight", content: "The crossover turn was so smooth how many years skating" },
    { authorName: "fog_on_ice", content: "Breath fog + sunset reflection = cinema" },
  ],
  "feed-4": [
    { authorName: "puppy_breath", content: "The snort at 0:02 ended me" },
    { authorName: "golden_gen", content: "Goldens really said joy is a personality type" },
    { authorName: "stick_court", content: "Supreme court of stick retrieval was 10/10" },
    { authorName: "grass_king", content: "That lawn is a premium zoomies arena" },
    { authorName: "ear_flip_fan", content: "Ear flip physics should be studied" },
    { authorName: "dog_sitter_sam", content: "Sending to every client who asks if puppies are calm" },
    { authorName: "tail_helicopter", content: "Tail RPM off the charts" },
    { authorName: "adopt_angel", content: "Biscuit is a perfect name protect him" },
    { authorName: "yard_enrichment", content: "Stick + grass + sunshine = golden recipe" },
    { authorName: "puppy_fever", content: "My apartment lease says no dogs this video is dangerous" },
    { authorName: "fetch_appeals", content: "He negotiated the stick like a tiny lawyer" },
    { authorName: "happiness_hour", content: "12 seconds of pure serotonin thank you" },
    { authorName: "retriever_rehab", content: "This cured my Monday" },
    { authorName: "paws_approved", content: "Vet tech here — healthy happy puppy vibes all around" },
  ],
  "feed-5": [
    { authorName: "gravity_tester", content: "Orange cats are peer-reviewed chaos scientists" },
    { authorName: "mug_memorial", content: "Pour one out for the mug" },
    { authorName: "shelf_inspector", content: "The shelf was not built for this energy" },
    { authorName: "slow_push", content: "The deliberate slow push is comedic gold" },
    { authorName: "eye_contact_crime", content: "Maintained eye contact throughout the crime iconic" },
    { authorName: "paw_print", content: "One brain cell holding the elevator door for the other" },
    { authorName: "tabby_union", content: "Union rep for orange cats approved this video" },
    { authorName: "knock_off", content: "Mine does this with water glasses I feel seen" },
    { authorName: "meow_finale", content: "Little meow after the crash — no remorse" },
    { authorName: "chaos_rating", content: "Chaos score 11/10 would watch again" },
    { authorName: "cat_lawyer", content: "Not guilty your honor the table was too cluttered" },
    { authorName: "whisker_witness", content: "Witnessed the same energy with a pen cup this morning" },
  ],
  "feed-19": [
    { authorName: "ridge_radio", content: "Cloud sea at sunrise never gets old" },
    { authorName: "alarm_4am", content: "4am alarm paid off — this is why hikers hike" },
    { authorName: "fog_window", content: "Fog window was maybe 20 minutes — timing is everything" },
    { authorName: "trail_mix", content: "What trail is this adding to my summer list" },
    { authorName: "pack_nerd", content: "Layer list in replies is chef kiss for beginners" },
    { authorName: "altitude_ace", content: "You can feel the cold air through the screen" },
    { authorName: "sunrise_tax", content: "Sunrise tax is sleep but views like this refund it" },
    { authorName: "cloud_ocean", content: "That is a cloud ocean not fog fight me" },
    { authorName: "trek_poles", content: "Trek poles in the foreground — detail appreciated" },
    { authorName: "leave_no_trace", content: "Beautiful shot and thanks for staying on trail" },
    { authorName: "fog_chaser", content: "Fog chasers know the ridge names by heart" },
    { authorName: "golden_ridge", content: "First light on the ridge line >>>" },
  ],
  "feed-2": [
    { authorName: "dive_log", content: "Logging this for my cert trip next spring" },
    { authorName: "coral_map", content: "Fish ID at 0:11 — bumphead parrotfish parade" },
    { authorName: "wetsuit_fit", content: "Buoyancy that clean takes hundreds of dives respect" },
    { authorName: "nitrox_nerd", content: "Nusa Penida side hits different for visibility" },
    { authorName: "blue_therapy", content: "Blue therapy session complete" },
    { authorName: "depth_debate", content: "Team deeper vs team shallow in the replies is so real" },
    { authorName: "reef_guardian", content: "Please do not touch the coral thumbs up for clean diving" },
    { authorName: "bubble_ring", content: "Ok but where is the bubble ring follow up" },
  ],
  "feed-6": [
    { authorName: "lap_timer", content: "Gap had to be a tenth — photo finish energy" },
    { authorName: "turn_three", content: "Turn 3 move was the whole race" },
    { authorName: "pit_lane", content: "My heart rate during the last lap is unhealthy" },
    { authorName: "onboard_pls", content: "Need onboard from P2 for the defensive line" },
    { authorName: "drs_debate", content: "DRS on or off for that overtake — discuss" },
    { authorName: "grandstand", content: "Crowd roar spike gave me chills" },
    { authorName: "telemetry", content: "Telemetry nerds eating good in this comment section" },
    { authorName: "p1_pick", content: "Had the wrong pick and still loved the battle" },
  ],
  "feed-11": [
    { authorName: "look_one_vote", content: "Office look wins Monday through Thursday" },
    { authorName: "look_two_vote", content: "Weekend sneakers fit is undefeated" },
    { authorName: "look_three_vote", content: "Date night look 3 — the belt detail >>>" },
    { authorName: "blazer_fit", content: "Shoulder fit on that blazer is doing heavy lifting" },
    { authorName: "capsule_core", content: "One blazer three moods is the capsule thesis" },
    { authorName: "thrift_find", content: "Thrifted blazers hit different when the fit is right" },
    { authorName: "mirror_check", content: "Mirror check transition at 0:09 is smooth" },
    { authorName: "heel_swap", content: "Heel swap alone changed the whole energy of look 3" },
    { authorName: "vote_poll", content: "Poll in my group chat is tied 4-4-4 help" },
    { authorName: "tailor_tip", content: "Sleeve length is perfect — off the rack or tailored?" },
    { authorName: "closet_math", content: "Cost per wear on that blazer just hit zero" },
  ],
  "feed-16": [
    { authorName: "roll_pull", content: "Pull-apart shot should be illegal before breakfast" },
    { authorName: "lamination", content: "Cold butter lamination gang rise up" },
    { authorName: "proof_night", content: "Overnight proof is the cheat code" },
    { authorName: "cinnamon_ratio", content: "Cinnamon sugar ratio looks perfect" },
    { authorName: "batch_small", content: "Small batch means I eat the whole tray alone no shame" },
    { authorName: "frost_swirl", content: "That swirl on top is bakery level" },
    { authorName: "oven_smell", content: "I smelled this video through the screen" },
    { authorName: "recipe_when", content: "Recipe drop when — the people need layers" },
  ],
  "feed-20": [
    { authorName: "soft_glam", content: "Soft glam that still looks like skin — rare" },
    { authorName: "thin_layer", content: "Thin layers only club membership approved" },
    { authorName: "lip_nude", content: "Rosy nude lip is the exact shade I have been hunting" },
    { authorName: "no_filter", content: "No filter and pores still visible thank you" },
    { authorName: "commute_ready", content: "Timed it — 12 min is accurate with practice" },
    { authorName: "cream_blush", content: "Cream blush placement note saved my face shape" },
    { authorName: "product_list", content: "Product list in bio is clutch" },
    { authorName: "grwm_real", content: "GRWM I can actually wear to the office" },
    { authorName: "blend_sponge", content: "Sponge vs brush for that base — which did you use" },
  ],
};
