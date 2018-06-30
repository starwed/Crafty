use CellManager;
use std::collections::hash_set::IntoIter;


// As we traverse across the map, we need to know not just the id of each candidate,
// but which subset of the traversal it belongs to
pub struct MapTraversalResult {
    pub id: i32,
    pub set_number: i32
}

pub struct EntityIterator {
    set_iterator: IntoIter<(i32)>
}

impl Iterator for EntityIterator {
    type Item = i32;

    #[inline]
    fn next(&mut self) -> Option<i32> {
        return self.set_iterator.next();
    }
}

// abstract the concept of iterating through the map contents in order
// Uses an iterator of entity iterators that represent the contents of each cell in 
// the traversal
//
// Which cells are examined, and in what order, is determined by the traverser
pub struct CellContentTraverser<T> where T:Iterator<Item=EntityIterator> {
    pub cell_traverser: T,
    current_candidate_iterator: Option<EntityIterator>,
    current_set_number: i32
}

impl<T> CellContentTraverser<T> where T:Iterator<Item=EntityIterator> {
    pub fn new(traverser: T) -> CellContentTraverser<T> {
        CellContentTraverser {
            current_set_number: 0,
            current_candidate_iterator: None,
            cell_traverser: traverser
        } 
    }
}

impl<T> Iterator for CellContentTraverser<T> where T:Iterator<Item=EntityIterator> {
    type Item = MapTraversalResult;
    fn next(&mut self) -> Option<MapTraversalResult> {
        // Init first iterator if necessary
        // doesn't increment the set number, since the only time this is None are in the first invocation or after the final result
        if let None = self.current_candidate_iterator {
            self.current_candidate_iterator = self.cell_traverser.next();
        }

        // loop until we get a result from an iterator, or the next iterator is empty
        while let Some(ref mut candidate_iterator) = self.current_candidate_iterator {
            if let Some(candidate) = candidate_iterator.next() {
                return Some(MapTraversalResult{
                    id: candidate,
                    set_number: self.current_set_number
                });
            } else {
                self.current_candidate_iterator =  self.cell_traverser.next();
                self.current_set_number += 1;
            }
        }

        return None;
    }
}

pub struct RayCellTraverser<'a> {
    pub cell_manager: &'a CellManager,
    pub max_distance: f32,

    pub step_col: i32,
    pub step_row: i32,

    pub current_col: i32,
    pub current_row: i32,

    pub t_max_x: f32,
    pub t_max_y: f32,
    pub t_delta_x: f32,
    pub t_delta_y: f32
}

impl<'a> Iterator for RayCellTraverser<'a> {
    type Item = EntityIterator;
    fn next(&mut self) -> Option<EntityIterator> {
            while self.t_max_x - self.t_delta_x < self.max_distance && self.t_max_y - self.t_delta_y < self.max_distance {
                // get cell contents
                let candidates = 
                    self.cell_manager
                        .find_broadphase(self.current_col, self.current_row, self.current_col, self.current_row);
                // step to the next cell
                if (self.t_max_x < self.t_max_y && self.step_col != 0) || self.step_row == 0 {
                    self.t_max_x += self.t_delta_x;
                    self.current_col += self.step_col;
                } else {
                    self.t_max_y += self.t_delta_y;
                    self.current_row += self.step_row;
                }
                
                return Some(EntityIterator {
                    set_iterator: candidates.into_iter()
                })
            }
            None
    }
}