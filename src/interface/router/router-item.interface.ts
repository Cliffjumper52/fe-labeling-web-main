export interface RouterItem {
  path: string;
  Component: React.LazyExoticComponent<React.FC<any>> | React.FC<any>;
  layout?: React.LazyExoticComponent<React.FC<any>> | React.FC<any>;
  sidebar?: React.LazyExoticComponent<React.FC<any>> | React.FC<any>;
  children?: Array<RouterItem>;
}
