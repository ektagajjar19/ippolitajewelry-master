import { h, Fragment } from 'preact';
import { observer } from 'mobx-react';
import { Banner, Slideout, useMediaQuery, ControllerProvider, Recommendation, useIntersection } from '@searchspring/snap-preact-components';
import { Results, NoResults } from './Results';
// import { SortBy } from './SortBy';
import { CustomFacets } from './Facets';
import { FilterSummary } from './FilterSummary';
import { Pagination } from './Pagination';
import { CustomSlideout } from './CustomSlideout';
import { SortBy } from './SortBy';
import { useRef } from 'preact/hooks';


export const Content = observer((props) => {
	const controller = props.controller;
	const {
		store,
		store: { pagination, merchandising, loading },
	} = controller;
	const isMobile = useMediaQuery('(max-width: 767px)');
	const infinite = useRef(null);
	const atBottom = pagination.totalResults > 0 ? useIntersection(infinite, '10px') : false;
	if (atBottom && pagination.next && !loading) {
		setTimeout(() => {
			pagination.next.url.go({ history: 'replace' });
		});
	}
	return (
		controller.store.loaded && (
			<ControllerProvider controller={controller}>
				<div className="ss__content">
					<Banner content={merchandising.content} type="header" />
					<Banner content={merchandising.content} type="banner" />

					{pagination.totalResults > 0 ? (
							
							<div class="CollectionMain">
							<span className='ftr-overlay'></span>	
							<button className='filter-btn'>Filter</button>	
							<div className='result-sortby'>
								<div id="searchspring-header"></div>
								<SortBy />
							</div>		
							 <div class="CollectionInner">
							  <div class="CollectionInner__Products">
                  		<FilterSummary />
								<div class="ProductListWrapper">
									{isMobile && store.facets.length && store.pagination.totalResults && (
									  <Slideout buttonContent={<SlideoutButton />}>
                      <SlideoutContent />
                    </Slideout>
                  )}
                   <CustomSlideout />
                   <Results results={store.results}/>
							</div>	
							</div>	
							{/* <Pagination pagination={store.pagination} /> */}
							<div className={`${loading ? 'infinte-loading' : 'infinte-load'}`} ref={infinite}></div>
						</div>
            </div>
					) : (
						pagination.totalResults === 0 && <NoResults />
					)}

					<Banner content={merchandising.content} type="footer" />
				</div>
        
			</ControllerProvider>
		)
	);
});

const SlideoutButton = () => {
	return <button>Filters</button>;
};

const SlideoutContent = (props) => {
	const { toggleActive, active } = props;

	return (
		active && (
			<>
				{/* slideout content here */}
				<FilterSummary />
				<CustomFacets />
			</>
		)
	);
};
