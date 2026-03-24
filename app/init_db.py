from datetime import datetime

from app.database import Base, SessionLocal, engine
from app.model import Case, SiteConfig


def init_db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed a default site config.
        if db.query(SiteConfig).count() == 0:
            db.add(
                SiteConfig(
                    home_hero_title="小熊集市活动服务平台",
                    home_hero_subtitle="让每一次活动都成为真正的城市记忆",
                    service_highlights='["创意设计","场景搭建","供应链协作","活动传播","现场运营"]',
                    contact_channels='{"email":"biz@example.com","wechat":"xiaoxiong_market"}',
                )
            )

        # Seed one published case for development preview.
        if db.query(Case).count() == 0:
            db.add(
                Case(
                    title="WTT 重庆站大型赛事执行案例",
                    slug="wtt-chongqing-example",
                    event_type="sports",
                    summary="覆盖活动策划、场景搭建与现场运营的全链路执行案例。",
                    cover_image_url="https://example.com/assets/wtt-cover.jpg",
                    gallery_urls='["https://example.com/assets/wtt-1.jpg","https://example.com/assets/wtt-2.jpg"]',
                    publish_status="published",
                    published_at=datetime.utcnow(),
                    tags='["赛事","城市活动"]',
                    seo_title="WTT 重庆站活动执行案例 - 小熊集市",
                    seo_description="小熊集市大型赛事活动全链路执行案例。",
                )
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
