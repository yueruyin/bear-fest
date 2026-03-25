import { Layout } from '../components/Layout'

const flow = ['创意设计', '场景搭建', '供应链协作', '活动传播', '现场运营']

export function ServicesPage() {
  return (
    <Layout>
      <section className="section">
        <div className="container">
          <h1>服务能力</h1>
          <p>覆盖活动全链路，支持大型赛事、嘉年华、潮流集市、企业年会与品牌活动。</p>
          <ol className="flow-list">
            {flow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>
    </Layout>
  )
}
