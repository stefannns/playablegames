import { TUXText, getColorCSSVar } from "@byted-tiktok/tux-web";
import {
  TUXIconChevronRightSlimThinLTR,
  TUXIconFireFill,
  TUXIconFlashFill,
  TUXIconMusicNoteFill,
} from "@byted-tiktok/tux-icons";

import { ProfileFeedThumb } from "./profile_feed_thumb";
import type {
  VisitorShop,
  VisitorShopProduct,
  VisitorShopPromoTag,
} from "./visitor_profile_utils";
import { ProfileVerifiedBadge } from "./profile_verified_badge";

type ShopTabContentProps = {
  shop: VisitorShop;
};

/**
 * 客态个人页 Shop tab。
 * 设计来自 Figma 节点 66708:28880 (Main-Framework-Main-File)。
 * 顶部 brand header（品牌名 + verified + Visit shop + Top Brand + 促销 banner）+ 2 列商品网格。
 */
export function ShopTabContent({ shop }: ShopTabContentProps) {
  return (
    <div className="flex flex-col gap-3 px-2 py-2 w-full">
      <BrandHeader shop={shop} />
      <ProductGrid products={shop.products} />
    </div>
  );
}

function BrandHeader({ shop }: { shop: VisitorShop }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg overflow-hidden"
      style={{
        backgroundColor: getColorCSSVar("UIPageGrouped2"),
      }}
    >
      {/* 第一行：品牌名 + verified + Visit shop */}
      <div className="flex items-start justify-between gap-2 px-3 pt-3">
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="flex items-center min-w-0">
            <TUXText
              typographyPreset="Headline-Semibold"
              color="UIText1"
              textDisplay="truncate"
              className="shrink min-w-0 leading-none"
            >
              {shop.brandName}
            </TUXText>
            <ProfileVerifiedBadge size={14} className="ml-0.5" />
          </div>
          <div className="flex items-center gap-1">
            <span
              className="flex items-center justify-center"
              style={{ width: 12, height: 12, color: getColorCSSVar("UIText1") }}
            >
              <TUXIconMusicNoteFill size={12} />
            </span>
            <TUXText
              typographyPreset="SmallText1-Semibold"
              color="UIText1"
              className="tracking-wide"
            >
              {shop.brandBadgeLabel}
            </TUXText>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-0.5 shrink-0"
          style={{ color: getColorCSSVar("UIText2") }}
          aria-label={`Visit ${shop.brandName} shop`}
        >
          <TUXText typographyPreset="P2-Regular" color="UIText2">
            Visit shop
          </TUXText>
          <span className="flex items-center justify-center w-3 h-3">
            <TUXIconChevronRightSlimThinLTR size={12} />
          </span>
        </button>
      </div>

      {/* 第二行：促销 banner */}
      <button
        type="button"
        className="flex items-center justify-between gap-2 px-3 pb-3 pt-1"
        style={{ width: "100%" }}
      >
        <TUXText
          typographyPreset="P2-Regular"
          color="UIText1"
          className="text-left"
        >
          Get{" "}
          <span style={{ color: getColorCSSVar("UIShapePrimary"), fontWeight: 600 }}>
            {shop.promoHighlight}
          </span>{" "}
          on all items over $
          {shop.promoText.split("$")[1] ?? ""}
        </TUXText>
        <span
          className="flex items-center justify-center w-4 h-4 shrink-0"
          style={{ color: getColorCSSVar("UIText2") }}
        >
          <TUXIconChevronRightSlimThinLTR size={14} />
        </span>
      </button>
    </div>
  );
}

function ProductGrid({ products }: { products: VisitorShopProduct[] }) {
  return (
    <div
      className="w-full"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
    >
      {products.map((product) => (
        <ProductCard key={product.key} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: VisitorShopProduct }) {
  return (
    <button
      type="button"
      className="flex flex-col overflow-hidden rounded-lg text-left"
      style={{
        backgroundColor: getColorCSSVar("UIPageFlat1"),
      }}
      aria-label={product.title}
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio: "1 / 1.18",
          backgroundColor: getColorCSSVar("UIShapeNeutral4"),
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          overflow: "hidden",
        }}
      >
        <ProfileFeedThumb
          thumbnailSrc={product.thumbnailSrc}
          videoThumbnailSrc={product.videoThumbnailSrc}
        />
      </div>
      <div className="flex flex-col gap-1 px-2 py-2">
        <TUXText
          typographyPreset="P2-Regular"
          color="UIText1"
          textDisplay="truncate"
          className="block w-full"
        >
          {product.title}
        </TUXText>
        <div className="flex items-baseline gap-0.5">
          <TUXText
            typographyPreset="SmallText1-Semibold"
            color="UITextPrimaryDisplay"
          >
            {product.priceCurrency}
          </TUXText>
          <TUXText
            typographyPreset="H4-Semibold"
            color="UITextPrimaryDisplay"
          >
            {product.priceAmount}
          </TUXText>
        </div>
        {product.promoTags.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {product.promoTags.map((tag) => (
              <PromoChip key={tag} tag={tag} />
            ))}
          </div>
        ) : null}
        <TUXText typographyPreset="P3-Regular" color="UIText3">
          {product.soldLabel}
        </TUXText>
      </div>
    </button>
  );
}

function PromoChip({ tag }: { tag: VisitorShopPromoTag }) {
  const isFlash = tag === "flash-sale";
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded"
      style={{
        paddingInline: 4,
        paddingBlock: 1,
        backgroundColor: isFlash
          ? "var(--tux-v2-color-ec-primary-banner)"
          : "var(--tux-v2-color-ec-orange-banner)",
        color: isFlash
          ? "var(--tux-v2-color-ec-primary-tag)"
          : "var(--tux-v2-color-ec-orange-main)",
      }}
    >
      <span className="inline-flex items-center justify-center" style={{ width: 12, height: 12 }}>
        {isFlash ? <TUXIconFlashFill size={10} /> : <TUXIconFireFill size={10} />}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2 }}>
        {isFlash ? "Flash sale" : "Hot deals"}
      </span>
    </span>
  );
}
