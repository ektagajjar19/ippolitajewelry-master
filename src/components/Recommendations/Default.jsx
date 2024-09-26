import { observer } from 'mobx-react';
import { h, render } from 'preact';
import './DefaultRecommendations.scss';
import { Result } from '../Results';
export const Default = observer((props) => {
	const { results } = props.controller.store;

	return (
		<section className="recommendation-scn">
			<h3 class="ss__recommendation__title">{props.controller.config.tag === "similar" ? "You may also like" : props.controller.config.tag === "recently-viewed" ? "Recently viewed" : "Recommended Products"}</h3>

			<div className="ProductList recs-list recs-slider splide">
				<div className="splide__track">
					<div className="splide__list">
						{results.map((result, i) => (
							<div className={`recs-item splide__slide item-${i + 1}`} key={result.id}>
								{{}[result.type] || <Result result={result} />}
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
});
