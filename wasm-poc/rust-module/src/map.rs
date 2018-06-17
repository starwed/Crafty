use std::collections::HashSet;
use std::collections::HashMap;
use std::collections::hash_map::Entry::{Occupied, Vacant};
use std::hash::{Hash, Hasher};
use std::f32::{INFINITY, NEG_INFINITY};
use ray_traverser::{CellContentTraverser, RayCellTraverser, MapTraversalResult};

#[derive(Debug)]
pub struct CraftyEntry {
    id: i32,
    // keys
    x1: i32,
    y1: i32,
    x2: i32,
    y2: i32,
    // crafty-style coordinates
    x: f32,
    y: f32,
    w: f32,
    h: f32
}


impl Hash for CraftyEntry {
    fn hash<H>(&self, state: &mut H) where H: Hasher {
        &self.id.hash(state);
    }
}

impl PartialEq for CraftyEntry {
    fn eq(&self, other: &Self) -> bool {
        &self.id == &other.id
    }
}

impl Eq for CraftyEntry {}

struct MapCell {
    entries: HashSet<i32>
}

impl MapCell {
    fn new() -> MapCell {
        MapCell { entries: HashSet::new() }
    }
}

pub struct CellManager {
   cells:  HashMap<(i32, i32), MapCell>
}

pub struct MapBoundaries {
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32 
}


pub trait SpatialMap {
    fn update_map<'a, 'b>(&mut self, id:i32, x:f32, y:f32, w:f32, h:f32);
    fn remove(&mut self, id:i32);
    fn search(&mut self, x: f32, y: f32, w: f32, h: f32) -> HashSet<i32>;
    fn unfiltered_search(&mut self, x: f32, y: f32, w: f32, h: f32) -> HashSet<i32>;
    
    // not necessary for crafty, but useful for testing
    fn check_cell<'a, 'b>(&mut self, id:i32, i: i32, j: i32)  -> bool;
    
    fn get_boundaries(&self) -> MapBoundaries;
}

pub struct GridSpatialMap {
    cell_manager: CellManager,
    crafty_entry_lookup: HashMap<i32, CraftyEntry>,
    cell_size: f32
}

impl GridSpatialMap {
    pub fn new() -> GridSpatialMap {
        GridSpatialMap {
            crafty_entry_lookup: HashMap::new(),
            cell_manager: CellManager::new(),
            cell_size: 64.0
        }
    }

    pub fn count_entries(&self) -> usize {
        self.cell_manager.cells.iter().count()
    }


    fn get_crafty_entries_in_cell<'a>(&'a self,  cell: &'a MapCell) ->  Vec<&CraftyEntry> {
        cell.entries
            .iter()
            .filter_map(|id| self.crafty_entry_lookup.get(id))
            .collect::<Vec<&CraftyEntry>>()
    }

    fn key( &self, coord: f32) -> i32 {
        (coord/self.cell_size).floor() as i32
    }

    // Starting at (ox, oy), look in the direction (dx, dy), yielding each entity that is found
    // Will return the same id multiple times if it exists in multiple cells, since a possible ray intersection
    // might not happen in the first cell the entity is found int.
    //
    // note: lifetime ellision doens't happen automatically for impl trait; that's what `+ '_` does

    // todo: fix case where dir_x/y = 0
    pub fn traverse_ray(& self, ox: f32, oy: f32, dir_x: f32, dir_y: f32, max_distance: f32) -> impl Iterator<Item=MapTraversalResult> + '_ {
        let current_col = self.key(ox);
        let current_row = self.key(oy);
        let size = self.cell_size;
        let norm = (dir_x * dir_x + dir_y * dir_y).sqrt();
        let nx = dir_x / norm;
        let ny = dir_y / norm;
        let rci = RayCellTraverser {
            cell_manager: &(self.cell_manager),
            max_distance: max_distance, 
            step_col: match nx {
                nx if nx > 0.0 => 1,
                nx if nx < 0.0 => -1,
                _ => 0
            },
            step_row: match ny {
                ny if ny > 0.0 => 1,
                ny if ny < 0.0 => -1,
                _ => 0
            },
            current_col: current_col,
            current_row: current_row,
            t_max_x: match nx {
                nx if nx > 0.0 => ((current_col + 1) as f32 * size - ox) / nx,
                nx if nx < 0.0 => (current_col as f32 * size - ox) / nx,
                _ => 0.0
            },
            t_max_y: match ny {
                ny if ny > 0.0 => ((current_row + 1) as f32 * size - oy) / ny,
                ny if ny < 0.0 => (current_row as f32 * size - oy) / ny,
                _ => 0.0
            },
            t_delta_x: match nx.abs() {
                abs_nx if abs_nx == 0.0 => 0.0,
                abs_nx => size / abs_nx
            },
            t_delta_y: match ny.abs() {
                abs_ny if abs_ny == 0.0 => 0.0,
                abs_ny => size / abs_ny
            }
        };

        return CellContentTraverser::new(rci)
    }
}

impl SpatialMap for GridSpatialMap {
    fn update_map<'a, 'b>(&mut self, id:i32, x:f32, y:f32, w:f32, h:f32)  {
        let x1 = self.key(x);
        let y1 = self.key(y);
        let x2 = self.key(x + w);
        let y2 = self.key(y + h);

        let entries = &mut self.crafty_entry_lookup;
        let map = &mut self.cell_manager;
            
        match entries.entry(id) {
            Occupied(mut entry) => {
                let crafty_entry = entry.get_mut();
                // First update coordinates, then update cell position
                crafty_entry.x = x;
                crafty_entry.y = y;
                crafty_entry.w = w;
                crafty_entry.h = h;
                map.update_entry(crafty_entry, x1, y1, x2, y2)
            },
            Vacant(entry) => {
                let new_entry = CraftyEntry {
                    id, x1, y1, x2, y2, x, y, w, h
                };
                map.insert_entry(&new_entry);
                entry.insert(new_entry);
            }
        }
    }

    // Just for testing, remove later
    fn check_cell<'a, 'b>(&mut self, id:i32, i: i32, j: i32)  -> bool {
        let map = &mut self.cell_manager;
        match map.cells.entry((i, j)) {
            Occupied(cell_entry) => cell_entry.get().entries.contains(&id),
            _ => false
        }
    }

    fn remove(&mut self, id:i32)  {
        let entry = self.crafty_entry_lookup.entry(id);
        if let Occupied(occupied_entry) = entry {
            self.cell_manager.remove_entry(occupied_entry.get());
        }
    }

    // Returns the set of ids in cells overlapping the given area
    fn unfiltered_search(&mut self, x: f32, y: f32, w: f32, h: f32) -> HashSet<i32> {
        self.cell_manager.find_broadphase(
            self.key(x),
            self.key(y),
            self.key(x + w),
            self.key(y + h))
    }

    fn search(&mut self, x: f32, y: f32, w: f32, h: f32) -> HashSet<i32> {
        let mut set = self.cell_manager.find_broadphase(
            self.key(x),
            self.key(y),
            self.key(x + w),
            self.key(y + h));
        
        set.retain(|id| {
            let e = self.crafty_entry_lookup.get(&id).unwrap();
            e.x < x + w && e.y < y + h && x < e.x + e.w && y < e.y + e.h
        });
        return set;
    }

    fn get_boundaries(&self) -> MapBoundaries {
        // set up the initial min/max values
        let mut min_x1 = <i32>::max_value();
        let mut min_y1 = <i32>::max_value();
        let mut max_x2 = <i32>::min_value();
        let mut max_y2 = <i32>::min_value();
        let mut boundaries = MapBoundaries {
            x1: INFINITY,
            x2: NEG_INFINITY,
            y1: INFINITY,
            y2: NEG_INFINITY
        };

        for ((i, j), cell) in self.cell_manager.cells.iter() {
            if *i <= min_x1 {
                min_x1 = *i;
                for entry in self.get_crafty_entries_in_cell(cell) {
                    if entry.x < boundaries.x1 {
                        boundaries.x1 = entry.x;
                    }
                }
            }
            if *j <= min_y1 {
                min_y1 = *j;
                for entry in self.get_crafty_entries_in_cell(cell) {
                    if entry.y < boundaries.y1 {
                        boundaries.y1 = entry.y;
                    }
                }
            }
            if *i >= max_x2 {
                max_x2 = *i;
                for entry in self.get_crafty_entries_in_cell(cell) {
                    if entry.x + entry.w > boundaries.x2 {
                        boundaries.x2 = entry.x + entry.w;
                    }
                }
            }
            if *j >= max_y2 {
                max_y2 = *j;
                for entry in self.get_crafty_entries_in_cell(cell) {
                    if entry.y + entry.h > boundaries.y2 {
                        boundaries.y2 = entry.y + entry.h;
                    }
                }
            }
        }
        boundaries
    }
}

impl<'a> CellManager {
    pub fn new() -> CellManager {
        CellManager {
            cells: HashMap::new()
        }
    }

    pub fn insert_entry(&mut self, entry:  &CraftyEntry) {
        for i in entry.x1 ..= entry.x2 {
            for j in entry.y1 ..= entry.y2 {
                let cell = self.cells
                    .entry((i, j))
                    .or_insert_with(||MapCell::new());
                cell.entries.insert(entry.id);
            }
        }
    }

    pub fn remove_entry(&mut self, entry: &CraftyEntry)  {
        for i in entry.x1 ..= entry.x2 {
            for j in entry.y1 ..= entry.y2 {
                if let Some(ref mut cell) = self.cells.get_mut(&(i, j)) {
                    cell.entries.remove(&entry.id);
                 }
            }
        }
    }

    pub fn update_entry(& mut self, entry: &mut CraftyEntry, x1: i32, y1: i32, x2: i32, y2: i32) {
        // Remove the entry, update it's values, then add it back
        // SO EFFICIENT!
        if x1 != entry.x1 || y1 != entry.y1 
            || x2 != entry.x2 || y2 != entry.y2 {
            self.remove_entry(entry);
            entry.x1 = x1;
            entry.y1 = y1;
            entry.x2 = x2;
            entry.y2 = y2;
            self.insert_entry(entry);
        } 
    }

    pub fn find_broadphase(& self, x1: i32, y1: i32, x2: i32, y2: i32) -> HashSet<i32> {
        let mut candidates = HashSet::new();
        for i in x1 ..= x2 {
            for j in y1 ..= y2 {
                if let Some(cell) = self.cells.get(&(i, j)) {
                    let entries = &cell.entries;
                    for id in entries {
                        candidates.insert(*id);
                    }
                }
            }
        }
        candidates
    }
} 

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn map_insertion() {
        let mut map = GridSpatialMap::new();
        map.update_map(1, 1.0, 1.0, 10.0, 10.0);
        let candidates = map.search(4.0, 4.0, 20.0, 20.0);
        assert!(candidates.contains(&1), "1 should be in search results");
    }

    #[test]
    fn map_removal() {
        let mut map = GridSpatialMap::new();
        
        map.update_map(1, 1.0, 1.0, 10.0, 10.0);
        let candidates = map.search(4.0, 4.0, 20.0, 20.0);
        assert!(candidates.contains(&1), "1 should be in search results");

        map.remove(1);
        let candidates = map.search(4.0, 4.0, 20.0, 20.0);
        assert!(!candidates.contains(&1), "1 should not be in search results");
    }

    #[test]
    fn update_map() {
        let mut map = GridSpatialMap::new();
        
        map.update_map(1, 1.0, 1.0, 10.0, 10.0);
        map.update_map(5, 30.0, 30.0, 64.0, 64.0);
        let candidates = map.search(4.0, 4.0, 20.0, 20.0);
        assert!(candidates.contains(&1), "1 should be in filtered search results");
        assert!(!candidates.contains(&5), "5 should not be in filtered search results");
        
        let candidates = map.unfiltered_search(4.0, 4.0, 20.0, 20.0);
        assert!(candidates.contains(&1), "1 should be in unfiltered search results");
        assert!(candidates.contains(&5), "5 should be in filtered search results");

        // Update the first entry's position such that it won't be in the search results
        map.update_map(1, 1000.0, 1000.0, 10.0, 10.0);
        let candidates = map.unfiltered_search(4.0, 4.0, 20.0, 20.0);
        assert!(!candidates.contains(&1), "1 should not be in search results");
        assert!(candidates.contains(&5), "5 should still be in search results");
    }

    #[test]
    fn boundaries() {
        let mut map = GridSpatialMap::new();
        map.update_map(1, 1.0, 2.0, 10.0, 10.0);
        map.update_map(5, 30.0, 30.0, 20.0, 25.0);
        let boundaries = map.get_boundaries();
        assert!(boundaries.x1 == 1.0);
        assert!(boundaries.y1 == 2.0);
        assert!(boundaries.x2 == 50.0);
        assert!(boundaries.y2 == 55.0);
    }

    #[test]
    fn ray_traversal() {
        let mut map = GridSpatialMap::new();
        map.update_map(1, 1.0, 2.0, 10.0, 10.0);
        map.update_map(2, 100.0, 0.0, 20.0, 25.0);
        map.update_map(3, 100.0, 100.0, 20.0, 25.0);
        let mut traverser = map.traverse_ray(1.0, 1.0, 1.0, 0.0, 1000.0);

        if let Some(r1)  = traverser.next() {
            assert!(r1.id == 1, "First traversal result should be 1");
        } else {
            assert!(false, "First traversal result should not be empty");
        }

        if let Some(r2)  = traverser.next() {
            assert!(r2.id == 2, "Second traversal result should be 2");
        } else {
            assert!(false, "Second traversal result should not be empty");
        }

        if let None = traverser.next() {
            assert!(true, "third traversal result should empty")
        } else {
            assert!(true, "third traversal result should empty")
        }
    }

    #[test]
    fn ray_traversal_negatvie() {
        let mut map = GridSpatialMap::new();
        map.update_map(1, 1.0, 2.0, 10.0, 10.0);
        map.update_map(2, 100.0, 0.0, 20.0, 25.0);
        map.update_map(3, 100.0, 100.0, 20.0, 25.0);
        let mut traverser = map.traverse_ray(110.0, 1.0, -1.0, 0.0001,  1000.0);

        
        if let Some(r1)  = traverser.next() {
            assert!(r1.id == 2, "First traversal result should be 1");
        } else {
            assert!(false, "First traversal result should not be empty");
        }

        if let Some(r2)  = traverser.next() {
            assert!(r2.id == 1, "Second traversal result should be 2");
        } else {
            assert!(false, "Second traversal result should not be empty");
        }

        if let None = traverser.next() {
            assert!(true, "third traversal result should empty")
        } else {
            assert!(false, "third traversal result should empty")
        }
    }
}
